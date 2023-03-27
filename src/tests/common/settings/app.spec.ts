import { LogLevel } from "@/common/log";
import {
  Thema,
  PieceImageType,
  normalizeAppSetting,
  BoardImageType,
  BoardLabelType,
  ClockSoundTarget,
  Tab,
  TabPaneType,
  EvaluationViewFrom,
  PositionImageStyle,
  PieceStandImageType,
  BackgroundImageType,
  LeftSideControlType,
  RightSideControlType,
} from "@/common/settings/app";
import { Language } from "@/common/i18n";

describe("settings/csa", () => {
  it("normalize", () => {
    const setting = {
      language: Language.JA,
      thema: Thema.DARK,
      backgroundImageType: BackgroundImageType.NONE,
      pieceImage: PieceImageType.HITOMOJI_GOTHIC,
      boardImage: BoardImageType.WARM,
      pieceStandImage: PieceStandImageType.GREEN,
      boardLabelType: BoardLabelType.NONE,
      leftSideControlType: LeftSideControlType.STANDARD,
      rightSideControlType: RightSideControlType.STANDARD,
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
      translateEngineOptionName: true,
      engineTimeoutSeconds: 60,
      evaluationViewFrom: EvaluationViewFrom.EACH,
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
      logLevel: LogLevel.INFO,
      positionImageStyle: PositionImageStyle.GAME,
      positionImageSize: 500,
      positionImageHeader: "header",
      lastRecordFilePath: "",
      lastUSIEngineFilePath: "",
      lastImageExportFilePath: "",
      lastOtherFilePath: "",
      emptyRecordInfoVisibility: true,
    };
    const result = normalizeAppSetting(setting, {
      returnCode: "\r\n",
      autoSaveDirectory: "/tmp",
    });
    expect(result).toStrictEqual(setting);
  });
});
