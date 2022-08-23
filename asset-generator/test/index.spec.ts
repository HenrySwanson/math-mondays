import { Tree } from "../src/assets/lib/tree"
import { TreeLayout } from "../src/assets/hydra/lib";

// TODO: can i put tests into the library folders?
test("tree layout", () => {
  let root = new Tree([0, 0], []);
  root.appendChild([-0.5, 1]);
  let child = root.appendChild([0.5, 1]);
  child.appendChild([0, 2]);
  child.appendChild([1, 2]);

  let layout = TreeLayout.fromTree(root);
  layout.tree.zip(root).forEachPreorder(([p, t]) => {
    expect(p.x).toEqual(t[0]);
    expect(p.y).toEqual(t[1]);
  });
});