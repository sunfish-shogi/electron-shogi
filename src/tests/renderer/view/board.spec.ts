import { shallowMount } from "@vue/test-utils";
import BoardView from "@/renderer/view/primitive/BoardView.vue";
import { Position } from "@/common/shogi";
import { RectSize } from "@/common/graphics";
import {
  BoardImageType,
  BoardLabelType,
  PieceImageType,
  PieceStandImageType,
} from "@/common/settings/app";

describe("BoardView", () => {
  it("hitomoji", () => {
    const position = new Position();
    const wrapper = shallowMount(BoardView, {
      props: {
        pieceImageType: PieceImageType.HITOMOJI,
        boardImageType: BoardImageType.LIGHT,
        pieceStandImageType: PieceStandImageType.STANDARD,
        boardLabelType: BoardLabelType.STANDARD,
        maxSize: new RectSize(800, 600),
        position,
      },
    });
    const imgs = wrapper.findAll("img");
    expect(
      imgs.filter((img) => img.attributes()["src"] === "./board/wood_light.png")
    ).toHaveLength(1);
    expect(
      imgs.filter(
        (img) => img.attributes()["src"] === "./piece/hitomoji/white_bishop.png"
      )
    ).toHaveLength(1);
    expect(
      imgs.filter(
        (img) => img.attributes()["src"] === "./piece/hitomoji/black_rook.png"
      )
    ).toHaveLength(1);
    expect(
      imgs.filter(
        (img) => img.attributes()["src"] === "./piece/hitomoji/black_gold.png"
      )
    ).toHaveLength(2);
    expect(
      imgs.filter(
        (img) =>
          img.attributes()["src"] === "./piece/hitomoji_gothic/black_gold.png"
      )
    ).toHaveLength(0);
  });

  it("hitomoji_gothic", () => {
    const position = new Position();
    const wrapper = shallowMount(BoardView, {
      props: {
        pieceImageType: PieceImageType.HITOMOJI_GOTHIC,
        boardImageType: BoardImageType.WARM,
        pieceStandImageType: PieceStandImageType.STANDARD,
        boardLabelType: BoardLabelType.STANDARD,
        maxSize: new RectSize(800, 600),
        position,
      },
    });
    const imgs = wrapper.findAll("img");
    expect(
      imgs.filter((img) => img.attributes()["src"] === "./board/wood_warm.png")
    ).toHaveLength(1);
    expect(
      imgs.filter(
        (img) =>
          img.attributes()["src"] === "./piece/hitomoji_gothic/white_bishop.png"
      )
    ).toHaveLength(1);
    expect(
      imgs.filter(
        (img) =>
          img.attributes()["src"] === "./piece/hitomoji_gothic/black_rook.png"
      )
    ).toHaveLength(1);
    expect(
      imgs.filter(
        (img) =>
          img.attributes()["src"] === "./piece/hitomoji_gothic/black_gold.png"
      )
    ).toHaveLength(2);
    expect(
      imgs.filter(
        (img) => img.attributes()["src"] === "./piece/hitomoji/black_gold.png"
      )
    ).toHaveLength(0);
  });
});
