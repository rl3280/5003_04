const tile = document.querySelector("#tile");
const edges = ["North", "East", "South", "West"];
const wireTile = {
  North: "conduct",
  East: "conduct",
  South: "off",
  West: "off"
};
const initiallyConductiveEdges = ["North", "East"];
let rotation = 0;

function updateTile() {
  tile.style.transform = `rotate(${rotation * 90}deg)`;

  edges.forEach((edge, index) => {
    const originalEdge = edges[(index - rotation + edges.length) % edges.length];
    wireTile[edge] = initiallyConductiveEdges.includes(originalEdge) ? "conduct" : "off";
  });
}

document.querySelector("#rotate-clockwise").addEventListener("click", () => {
  rotation = (rotation + 1) % edges.length;
  updateTile();
});

document.querySelector("#rotate-counterclockwise").addEventListener("click", () => {
  rotation = (rotation - 1 + edges.length) % edges.length;
  updateTile();
});
