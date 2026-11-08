// Find the board, tray, tiles, and slots on the page.
const tray = document.querySelector("#tile-tray");
const tiles = document.querySelectorAll(".tile");
const slots = document.querySelectorAll(".board-slot");
const board = document.querySelector(".board");
const edges = ["North", "East", "South", "West"];

// Record each tile's edges before it has been rotated.
const initialTileEdges = {
  battery: { North: "+", East: "+", South: "-", West: "-" },
  led: { North: "+", East: "+", South: "-", West: "-" },
  resistor: { North: "A", East: "A", South: "B", West: "B" },
  "bent wire": { North: "conduct", East: "conduct", South: "off", West: "off" }
};

// All tiles start in the tray, with no rotation.
const tileLocations = {
  battery: "tray",
  led: "tray",
  resistor: "tray",
  "bent wire": "tray"
};
const tileStates = {};
tiles.forEach((tile) => {
  const name = tile.dataset.tile;
  tileStates[name] = { rotation: 0, edges: { ...initialTileEdges[name] } };
});
let draggedTile = null;

// Remember the tile while it is being dragged.
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

// Allow a tile to be dropped on a slot or the tray.
function allowDrop(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

// Find the tile identified by the drag event.
function getDraggedTile(event) {
  const tileName = event.dataTransfer.getData("text/plain");
  return document.querySelector(`[data-tile="${tileName}"]`) || draggedTile;
}

// Change slot styling when a tile is placed or removed.
function updateSlotStyles() {
  slots.forEach((slot) => {
    slot.classList.toggle("occupied", slot.querySelector(".tile") !== null);
  });
}

// ---- Circuit control flow ----
let circuitConditions;

function updateCircuitCondition() {
  // List the two edges of each slot that face the center of the grid.
  const centerEdges = {
    "top-left": ["East", "South"],
    "top-right": ["West", "South"],
    "bottom-left": ["East", "North"],
    "bottom-right": ["West", "North"]
  };

  // Both conducting sides of the wire must face the center.
  const wireLocation = tileLocations["bent wire"];
  const wireEdges = tileStates["bent wire"].edges;
  const wireAligned =
    wireLocation !== "tray" &&
    centerEdges[wireLocation].every((edge) => wireEdges[edge] === "conduct");

  // Each neighbor is in the same position as its touching edge above.
  const neighboringSlots = {
    "top-left": ["top-right", "bottom-left"],
    "top-right": ["top-left", "bottom-right"],
    "bottom-left": ["bottom-right", "top-left"],
    "bottom-right": ["bottom-left", "top-right"]
  };

  // The resistor needs two neighbors, one touching A and one touching B.
  const resistorLocation = tileLocations.resistor;
  const resistorEdges = tileStates.resistor.edges;
  let resistorConnected = false;

  if (resistorLocation !== "tray") {
    const touchingEdges = centerEdges[resistorLocation];
    const neighborsPresent = neighboringSlots[resistorLocation].every((slot) =>
      Object.values(tileLocations).includes(slot)
    );
    resistorConnected = neighborsPresent &&
      resistorEdges[touchingEdges[0]] !== resistorEdges[touchingEdges[1]];
  }

  // The battery's two inward-facing edges must have different polarities.
  const ledLocation = tileLocations.led;
  const batteryLocation = tileLocations.battery;
  const batteryEdges = tileStates.battery.edges;
  let batteryAligned = false;
  let ledCondition = "not touching battery";

  if (batteryLocation !== "tray") {
    const inwardEdges = centerEdges[batteryLocation];
    batteryAligned = batteryEdges[inwardEdges[0]] !== batteryEdges[inwardEdges[1]];
  }

  // For adjacent tiles, the touching LED and battery edges must match.
  if (
    ledLocation !== "tray" &&
    neighboringSlots[ledLocation].includes(batteryLocation)
  ) {
    const neighborIndex = neighboringSlots[ledLocation].indexOf(batteryLocation);
    const ledEdge = centerEdges[ledLocation][neighborIndex];
    const oppositeEdges = { North: "South", East: "West", South: "North", West: "East" };
    const batteryEdge = oppositeEdges[ledEdge];

    if (tileStates.led.edges[ledEdge] === batteryEdges[batteryEdge]) {
      ledCondition = "polarity correct";
    } else {
      ledCondition = "polarity incorrect";
    }
  } else if (ledLocation !== "tray" && batteryLocation !== "tray") {
    // For diagonal tiles, compare the battery and LED through each neighbor.
    const paths = neighboringSlots[batteryLocation];
    const pathsPresent = paths.every((slot) => Object.values(tileLocations).includes(slot));

    if (!pathsPresent) {
      ledCondition = "waiting for connecting tiles";
    } else {
      const matchingPolarity = paths.every((slot, index) => {
        const batteryEdge = centerEdges[batteryLocation][index];
        const ledEdge = centerEdges[ledLocation][neighboringSlots[ledLocation].indexOf(slot)];
        return batteryEdges[batteryEdge] === tileStates.led.edges[ledEdge];
      });
      ledCondition = matchingPolarity ? "polarity correct" : "polarity incorrect";
    }
  }

  // Save the results and light the LED only when every condition passes.
  let batteryCondition = "not placed";
  if (batteryLocation !== "tray") {
    batteryCondition = batteryAligned ? "aligned" : "not aligned";
  }
  const circuitComplete = wireAligned && resistorConnected && batteryAligned &&
    ledCondition === "polarity correct";
  circuitConditions = {
    battery: batteryCondition,
    wire: wireAligned ? "aligned" : "not aligned",
    resistor: resistorConnected ? "connected" : "broken connection",
    led: ledCondition,
    circuit: circuitComplete ? "complete circuit" : "broken circuit"
  };

  const led = document.querySelector("#led");
  led.classList.toggle("lit", circuitComplete);
  led.setAttribute("aria-label", circuitComplete ? "LED tile, lit" : "LED tile, off");
}
// ---- End circuit control flow ----

// Rotate the picture and update the values of its four edges.
function updateTile(tile) {
  const state = tileStates[tile.dataset.tile];
  const image = tile.querySelector("img");
  image.style.transform = `rotate(${state.rotation * 90}deg)`;

  // Look back through the original edges to find which one moved to each side.
  edges.forEach((edge, index) => {
    const originalEdge = edges[(index - state.rotation + edges.length) % edges.length];
    state.edges[edge] = initialTileEdges[tile.dataset.tile][originalEdge];
    tile.dataset[edge.toLowerCase()] = state.edges[edge];
  });
}

// Set up the starting edge values and circuit condition.
tiles.forEach(updateTile);
updateCircuitCondition();

// Rotate the tile in a slot when one of its arrow buttons is clicked.
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
  // JavaScript's remainder can be negative, so add four before wrapping.
  state.rotation = button.dataset.rotate === "clockwise"
    ? (state.rotation + 1) % edges.length
    : (state.rotation - 1 + edges.length) % edges.length;
  updateTile(tile);
  updateCircuitCondition();
});

// Accept tiles dropped on empty board slots.
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
    updateCircuitCondition();
  });
});

// Return tiles to the tray and update the circuit.
tray.addEventListener("dragover", allowDrop);
tray.addEventListener("dragenter", () => tray.classList.add("drag-over"));
tray.addEventListener("dragleave", (event) => {
  if (!tray.contains(event.relatedTarget)) {
    tray.classList.remove("drag-over");
  }
});
tray.addEventListener("drop", (event) => {
  event.preventDefault();
  tray.classList.remove("drag-over");

  const tile = getDraggedTile(event);
  if (!tile) {
    return;
  }

  tray.append(tile);
  tileLocations[tile.dataset.tile] = "tray";
  updateSlotStyles();
  updateCircuitCondition();
});
