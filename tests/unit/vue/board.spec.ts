import { shallowMount } from "@vue/test-utils";
import BoardVue from "@/components/primitive/Board.vue";
import { Position } from "@/shogi";
import { RectSize } from "@/layout/types";
import { BoardLayoutType } from "@/layout/board";

describe("Board.vue", () => {
  it("renders props.msg when passed", () => {
    const position = new Position();
    const wrapper = shallowMount(BoardVue, {
      props: {
        layoutType: BoardLayoutType.HITOMOJI,
        maxSize: new RectSize(800, 600),
        position,
      },
    });
    expect(wrapper.text()).toMatch("");
  });
});
