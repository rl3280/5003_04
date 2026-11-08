const tray = document.querySelector("#tile-tray");
const status = document.querySelector("#status");
const tiles = document.querySelectorAll(".tile");
const slots = document.querySelectorAll(".board-slot");
const board = document.querySelector(".board");
const edges = ["North", "East", "South", "West"];
const initialTileEdges = {
  battery: { North: "+", East: "+", South: "-", West: "-" },
  led: { North: "+", East: "+", South: "-", West: "-" },
  resistor: { North: "A", East: "A", South: "B", West: "B" },
  "bent wire": { North: "conduct", East: "conduct", South: "off", West: "off" }
};
const tileLocations = {
  battery: "tray",
  led: "tray",
  resistor: "tray",
  "bent wire": "tray"
};
const tileStates = Object.fromEntries(
  Array.from(tiles, (tile) => [
    tile.dataset.tile,
    { rotation: 0, edges: { ...initialTileEdges[tile.dataset.tile] } }
  ])
);
let draggedTile = null;

tiles.forEach((tile) => {
  tile.addEventListener("dragstart", (event) => {
    draggedTile = tile;
    tile.classList.add("dragging");
    event.dataTransfer.setData("text/plain", tile.dataset.tile);
    event.dataTransfer.effectAllowed = "move";
  });

  tile.addEventListener("dragend", () => {
    tile.classList.remove("dragging");
    draggedTile = null;
  });
});

function allowDrop(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

function getDraggedTile(event) {
  const tileName = event.dataTransfer.getData("text/plain");
  return document.querySelector(`[data-tile="${tileName}"]`) || draggedTile;
}

function updateSlotStyles() {
  slots.forEach((slot) => {
    slot.classList.toggle("occupied", slot.querySelector(".tile") !== null);
  });
}

function updateStatus() {
  const placedTiles = Object.entries(tileLocations)
    .filter(([, location]) => location !== "tray")
    .map(([name, location]) => `${name} in ${location}`);
  const trayTiles = Object.keys(tileLocations)
    .filter((name) => tileLocations[name] === "tray");

  status.textContent = [
    trayTiles.length ? `Tiles in tray: ${trayTiles.join(", ")}.` : "All tiles are on the board.",
    placedTiles.length ? ` On board: ${placedTiles.join("; ")}.` : ""
  ].join("");
}

function updateTile(tile) {
  const state = tileStates[tile.dataset.tile];
  const image = tile.querySelector("img");
  image.style.transform = `rotate(${state.rotation * 90}deg)`;

  edges.forEach((edge, index) => {
    const originalEdge = edges[(index - state.rotation + edges.length) % edges.length];
    state.edges[edge] = initialTileEdges[tile.dataset.tile][originalEdge];
    tile.dataset[edge.toLowerCase()] = state.edges[edge];
  });
}

tiles.forEach(updateTile);

board.addEventListener("click", (event) => {
  const button = event.target.closest(".rotate-button");
  if (!button) {
    return;
  }

  const slot = button.closest(".board-slot");
  const tile = slot.querySelector(".tile");
  if (!tile) {
    return;
  }

  const state = tileStates[tile.dataset.tile];
  state.rotation = button.dataset.rotate === "clockwise"
    ? (state.rotation + 1) % edges.length
    : (state.rotation - 1 + edges.length) % edges.length;
  updateTile(tile);
});

slots.forEach((slot) => {
  slot.addEventListener("dragover", allowDrop);
  slot.addEventListener("dragleave", () => slot.classList.remove("drag-over"));
  slot.addEventListener("dragenter", () => slot.classList.add("drag-over"));
  slot.addEventListener("drop", (event) => {
    event.preventDefault();
    slot.classList.remove("drag-over");

    const tile = getDraggedTile(event);
    if (!tile || (slot.querySelector(".tile") && !slot.contains(tile))) {
      return;
    }

    slot.append(tile);
    tileLocations[tile.dataset.tile] = slot.dataset.slot;
    updateSlotStyles();
    updateStatus();
  });
});

tray.addEventListener("dragover", allowDrop);
tray.addEventListener("drop", (event) => {
  event.preventDefault();

  const tile = getDraggedTile(event);
  if (!tile) {
    return;
  }

  tray.append(tile);
  tileLocations[tile.dataset.tile] = "tray";
  updateSlotStyles();
  updateStatus();
});
