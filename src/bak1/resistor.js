const tile = document.querySelector("#tile");
let rotation = 0;

function updateTile() {
  tile.style.transform = `rotate(${rotation * 90}deg)`;
}

document.querySelector("#rotate-clockwise").addEventListener("click", () => {
  rotation = (rotation + 1) % 4;
  updateTile();
});

document.querySelector("#rotate-counterclockwise").addEventListener("click", () => {
  rotation = (rotation + 3) % 4;
  updateTile();
});
