<template>
  <div>
    <div class="full">
      <div ref="root" class="full column" @copy.stop>
        <div class="headers">
          <div>
            {{ t.updatedAt }}: {{ updatedMs ? getDateTimeStringMs(new Date(updatedMs)) : "---" }}
          </div>
          <div>{{ t.usiEngine }}: {{ states.usiSessions.length }}</div>
          <div>{{ t.csaServer }}: {{ states.csaSessions.length }}</div>
        </div>
        <div v-if="updatedMs" class="main" :style="{ height: `${size.height - 20}px` }">
          <div v-if="states.usiSessions.length === 0" class="entry">
            <div class="label">{{ t.noRunningUSIEngine }}</div>
          </div>
          <div v-for="session of states.usiSessions" :key="session.sessionID" class="entry">
            <div v-if="session.closed" class="label warning">
              {{ t.willBeRemovedFromTheListSoon }}
            </div>
            <div class="label">{{ t.usiEngine }} - SID: {{ session.sessionID }}</div>
            <div>
              <span class="key">{{ t.name }}:</span>
              {{ session.name }}
            </div>
            <div>
              <span class="key">URI:</span>
              {{ session.uri }}
            </div>
            <div>
              <span class="key">{{ t.enginePath }}:</span>
              {{ session.path }}
            </div>
            <div v-if="session.pid">
              <span class="key">PID:</span>
              {{ session.pid }}
            </div>
            <div>
              <span class="key">{{ t.createdAt }}:</span>
              {{ getDateTimeStringMs(new Date(session.createdMs)) }}
              <span class="timestamp"
                >({{ formatRelativeTime(session.createdMs, updatedMs) }})</span
              >
            </div>
            <div>
              <span class="key">State:</span>
              {{ session.stateCode }}
            </div>
            <div v-if="session.lastSent">
              <span class="key">{{ t.lastSent }}:</span>
            </div>
            <div v-if="session.lastSent">
              <span class="command">{{ session.lastSent.command || `(${t.blankLine})` }}</span>
            </div>
            <div v-if="session.lastSent" class="timestamp">
              Sent at {{ getDateTimeStringMs(new Date(session.lastSent.timeMs)) }} ({{
                formatRelativeTime(session.lastSent.timeMs, updatedMs)
              }})
            </div>
            <div v-if="session.lastReceived">
              <span class="key">{{ t.lastReceived }}:</span>
            </div>
            <div v-if="session.lastReceived">
              <span class="command">{{ session.lastReceived.command || `(${t.blankLine})` }}</span>
            </div>
            <div v-if="session.lastReceived" class="timestamp">
              Received at {{ getDateTimeStringMs(new Date(session.lastReceived.timeMs)) }} ({{
                formatRelativeTime(session.lastReceived.timeMs, updatedMs)
              }})
            </div>
            <div class="row">
              <button @click="openUSIPrompt(session)">{{ t.openPrompt }}</button>
              <button @click="sendUSIQuit(session)">{{ t.forceQuit }}</button>
            </div>
          </div>
          <div v-if="states.csaSessions.length === 0" class="entry">
            <div class="label">{{ t.noConnectedCSAServer }}</div>
          </div>
          <div v-for="session of states.csaSessions" :key="session.sessionID" class="entry">
            <div v-if="session.closed" class="label warning">
              {{ t.willBeRemovedFromTheListSoon }}
            </div>
            <div class="label">{{ t.csaServer }} - SID: {{ session.sessionID }}</div>
            <div>
              <span class="key">{{ t.server }}:</span>
              {{ session.host }}:{{ session.port }}
            </div>
            <div>
              <span class="key">{{ t.protocolVersion }}:</span>
              {{ session.protocolVersion }}
            </div>
            <div>
              <span class="key">ID:</span>
              {{ session.loginID }}
            </div>
            <div>
              <span class="key">{{ t.createdAt }}:</span>
              {{ getDateTimeStringMs(new Date(session.createdMs)) }}
              <span class="timestamp"
                >({{ formatRelativeTime(session.createdMs, updatedMs) }})</span
              >
            </div>
            <div>
              <span class="key">State:</span>
              {{ session.stateCode }}
            </div>
            <div v-if="session.lastSent">
              <span class="key">{{ t.lastSent }}:</span>
            </div>
            <div v-if="session.lastSent">
              <span class="command">{{ session.lastSent.command || `(${t.blankLine})` }}</span>
            </div>
            <div v-if="session.lastSent" class="timestamp">
              Sent at {{ getDateTimeStringMs(new Date(session.lastSent.timeMs)) }} ({{
                formatRelativeTime(session.lastSent.timeMs, updatedMs)
              }})
            </div>
            <div v-if="session.lastReceived">
              <span class="key">{{ t.lastReceived }}:</span>
            </div>
            <div v-if="session.lastReceived">
              <span class="command">{{ session.lastReceived.command || `(${t.blankLine})` }}</span>
            </div>
            <div v-if="session.lastReceived" class="timestamp">
              Received at {{ getDateTimeStringMs(new Date(session.lastReceived.timeMs)) }} ({{
                formatRelativeTime(session.lastReceived.timeMs, updatedMs)
              }})
            </div>
            <div class="row">
              <button @click="openCSAPrompt(session)">{{ t.openPrompt }}</button>
              <button @click="closeCSA(session)">{{ t.forceClose }}</button>
            </div>
          </div>
        </div>
        <div v-else class="main">Collecting...</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RectSize } from "@/common/assets/geometry";
import { getDateTimeStringMs } from "@/common/helpers/datetime";
import { CSASessionState, SessionStates, USISessionState } from "@/common/advanced/monitor";
import { PromptTarget } from "@/common/advanced/prompt";
import api from "@/renderer/ipc/api";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { LogLevel } from "@/common/log";
import { t } from "@/common/i18n";
import { useErrorStore } from "@/renderer/store/error";
import { useConfirmationStore } from "@/renderer/store/confirm";

defineProps({
  size: {
    type: RectSize,
    required: true,
  },
});

let timer: number | null = null;
const states = ref<SessionStates>({
  usiSessions: [],
  csaSessions: [],
});
const updatedMs = ref<number>(0);

function update() {
  api
    .collectSessionStates()
    .then((s) => {
      states.value = s;
      updatedMs.value = new Date().getTime();
    })
    .catch((e) => {
      useErrorStore().add(e);
    });
}

function formatRelativeTime(ms: number, baseMs: number) {
  const s = (baseMs - ms) / 1000;
  return `${s.toFixed(3)} seconds ago`;
}

onMounted(() => {
  update();
  timer = window.setInterval(update, 1000);
});

onBeforeUnmount(() => {
  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
});

function openUSIPrompt(session: USISessionState) {
  api.log(
    LogLevel.INFO,
    `MonitorView: Open USI prompt for SID=${session.sessionID} Name=[${session.name}]`,
  );
  api.openPrompt(PromptTarget.USI, session.sessionID, session.name);
}

function sendUSIQuit(session: USISessionState) {
  useConfirmationStore().show({
    message: `${session.name} に "quit" を送信します。本当に実行しますか？`,
    onOk: () => {
      api.log(
        LogLevel.INFO,
        `MonitorView: Send USI quit command to SID=${session.sessionID} Name=[${session.name}]`,
      );
      api.usiQuit(session.sessionID).catch((e) => {
        useErrorStore().add(e);
      });
    },
  });
}

function openCSAPrompt(session: CSASessionState) {
  api.log(
    LogLevel.INFO,
    `MonitorView: Open CSA prompt for SID=${session.sessionID} Server=[${session.host}:${session.port}]`,
  );
  const name = `${session.host}:${session.port}`;
  api.openPrompt(PromptTarget.CSA, session.sessionID, name);
}

function closeCSA(session: CSASessionState) {
  useConfirmationStore().show({
    message: `${session.host}:${session.port} への接続を強制終了します。本当に実行しますか？`,
    onOk: () => {
      api.log(
        LogLevel.INFO,
        `MonitorView: Close CSA session for SID=${session.sessionID} Server=[${session.host}:${session.port}]`,
      );
      api.csaLogout(session.sessionID).catch((e) => {
        useErrorStore().add(e);
      });
    },
  });
}
</script>

<style scoped>
.headers {
  font-size: 14px;
  height: 20px;
  display: flex;
  flex-direction: row;
}
.headers > * {
  background-color: var(--text-bg-color);
  padding: 1px 5px;
  margin-right: 5px;
}
.headers > *:last-child {
  margin-right: auto;
}
.main {
  background-color: var(--text-bg-color);
  overflow: auto;
}
.main > * {
  margin-bottom: 3px;
  border-bottom: dashed var(--text-separator-color) 1px;
}
.entry {
  font-size: 12px;
  text-align: left;
  background-color: var(--text-bg-color);
}
.entry > * {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.command {
  white-space: pre;
}
.entry > .label {
  text-align: center;
}
.entry button {
  margin: 2px 5px;
}
.key {
  font-weight: bold;
}
.timestamp {
  font-size: 10px;
}
</style>
