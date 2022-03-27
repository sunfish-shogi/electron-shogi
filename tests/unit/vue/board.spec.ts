import { shallowMount } from "@vue/test-utils";
import BoardVue from "@/components/primitive/Board.vue";
import { Position } from "@/shogi";
import { RectSize } from "@/components/primitive/Types";
import { BoardLayoutType } from "@/components/primitive/BoardLayout";

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
