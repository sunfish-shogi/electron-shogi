import {
  Thema,
  PieceImageType,
  normalizeAppSetting,
  BoardImageType,
  BoardLabelType,
  ClockSoundTarget,
  Tab,
  TabPaneType,
} from "@/common/settings/app";

describe("settings/csa", () => {
  it("normalize", () => {
    const setting = {
      thema: Thema.DARK,
      pieceImage: PieceImageType.HITOMOJI_GOTHIC,
      boardImage: BoardImageType.WARM,
      boardLabelType: BoardLabelType.NONE,
      pieceVolume: 10,
      clockVolume: 20,
      clockPitch: 300,
      clockSoundTarget: ClockSoundTarget.ONLY_USER,
      boardFlipping: true,
      tabPaneType: TabPaneType.SINGLE,
      tab: Tab.PV,
      tab2: Tab.COMMENT,
      topPaneHeightPercentage: 50,
      topPanePreviousHeightPercentage: 50,
      bottomLeftPaneWidthPercentage: 80,
      returnCode: "\r",
      autoSaveDirectory: "/tmp/electron-shogi",
      engineTimeoutSeconds: 60,
      coefficientInSigmoid: 1000,
      badMoveLevelThreshold1: 1,
      badMoveLevelThreshold2: 2,
      badMoveLevelThreshold3: 3,
      badMoveLevelThreshold4: 4,
      showElapsedTimeInRecordView: false,
      showCommentInRecordView: false,
      enableAppLog: true,
      enableUSILog: true,
      enableCSALog: true,
    };
    const result = normalizeAppSetting(setting, {
      returnCode: "\r\n",
      autoSaveDirectory: "/tmp",
    });
    expect(result).toStrictEqual(setting);
  });
});
