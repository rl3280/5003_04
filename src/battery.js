const tile = document.querySelector("#tile");
const edges = ["North", "East", "South", "West"];
const initialPolarities = {
  North: "+",
  East: "+",
  South: "-",
  West: "-"
};
const batteryTile = { ...initialPolarities };
let rotation = 0;

function updateTile() {
  tile.style.transform = `rotate(${rotation * 90}deg)`;

  edges.forEach((edge, index) => {
    const originalEdge = edges[(index - rotation + edges.length) % edges.length];
    batteryTile[edge] = initialPolarities[originalEdge];
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
