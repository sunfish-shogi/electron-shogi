import { TimeoutChain } from "@/helpers/testing";
import api, { API } from "@/ipc/api";
import { useStore } from "@/store";
import { RecordCustomData } from "@/store/record";
import iconv from "iconv-lite";

jest.mock("@/ipc/api");
const mockAPI = api as jest.Mocked<API>;

describe("store/index", () => {
  it("openRecord", () => {
    const data = `
手合割：平手
手数----指手---------消費時間--
   1 ２六歩(27)   ( 0:00/00:00:00)
*通常コメント
   2 ８四歩(83)   ( 0:00/00:00:00)
*#評価値=108
   3 ７六歩(77)   ( 0:00/00:00:00)
   4 ８五歩(84)   ( 0:00/00:00:00)
   5 ７七角(88)   ( 0:00/00:00:00)
   6 ３二金(41)   ( 0:00/00:00:00)
   7 ６八銀(79)   ( 0:00/00:00:00)
   8 ３四歩(33)   ( 0:00/00:00:00)
   9 ７八金(69)   ( 0:00/00:00:00)
  10 ４二銀(31)   ( 0:00/00:00:00)
`;
    mockAPI.showOpenRecordDialog.mockResolvedValueOnce("/test/sample.kif");
    mockAPI.openRecord.mockResolvedValueOnce(iconv.encode(data, "Shift_JIS"));
    const store = useStore();
    store.openRecord();
    return new TimeoutChain()
      .next(() => {
        const moves = store.record.moves;
        expect(moves.length).toBe(11);
        expect(moves[1].comment).toBe("通常コメント");
        expect(moves[1].customData).toBeUndefined();
        expect(moves[2].comment).toBe("#評価値=108");
        expect(
          new RecordCustomData(moves[2].customData).evaluation?.researcher
        ).toBe(108);
      })
      .invoke();
  });
});
