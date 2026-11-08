# Circuit Tiles Code Report

This report describes how the circuit-tile app tracks state, responds to user
actions, and decides whether to light the LED. The code examples come from
[circuit.js](./src/circuit.js) and [circuit.html](./src/circuit.html).

## 1. State variables

State is the information the app remembers about the tiles and the circuit.

### Tile locations

`tileLocations` records whether each tile is in the tray or in a board slot.
All four tiles begin in the tray:

```js
const tileLocations = {
  battery: "tray",
  led: "tray",
  resistor: "tray",
  "bent wire": "tray"
};
```

For example, after the battery is dropped in the upper-left slot, its location
becomes `"top-left"`.

### Tile rotation and edges

`initialTileEdges` stores the edge values before any tile is rotated. The
battery and LED use `+` and `-`; the resistor uses `A` and `B`; and the bent
wire uses `"conduct"` and `"off"`:

```js
const initialTileEdges = {
  battery: { North: "+", East: "+", South: "-", West: "-" },
  led: { North: "+", East: "+", South: "-", West: "-" },
  resistor: { North: "A", East: "A", South: "B", West: "B" },
  "bent wire": { North: "conduct", East: "conduct", South: "off", West: "off" }
};
```

`tileStates` stores each tile's current rotation and current edge values.
Rotation starts at `0`; the edge values begin as a copy of the initial values:

```js
const tileStates = {};
tiles.forEach((tile) => {
  const name = tile.dataset.tile;
  tileStates[name] = { rotation: 0, edges: { ...initialTileEdges[name] } };
});
```

### Drag and circuit state

`draggedTile` temporarily remembers the tile being dragged. It is reset to
`null` when the drag ends.

```js
let draggedTile = null;
```

`circuitConditions` stores the results of the latest circuit check. The app
updates it after a tile is moved or rotated:

```js
circuitConditions = {
  battery: batteryCondition,
  wire: wireAligned ? "aligned" : "not aligned",
  resistor: resistorConnected ? "connected" : "broken connection",
  led: ledCondition,
  circuit: circuitComplete ? "complete circuit" : "broken circuit"
};
```

## 2. User interaction

The user can drag tiles from the tray to empty board slots, move tiles between
slots, and drag tiles back to the tray. The tile elements are marked as
draggable in the HTML:

```html
<div class="tile" id="battery" data-tile="battery" draggable="true" aria-label="Battery tile">
  <img src="../svg/battery.svg" alt="">
  <span>Battery</span>
</div>
```

Each board slot also has buttons for rotating a placed tile counterclockwise
or clockwise. For example, the top-left slot has these controls:

```html
<button type="button" class="rotate-button" data-rotate="counterclockwise" aria-label="Rotate tile in top-left space counterclockwise"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M19 11a7 7 0 0 0-13-3M6 4v4h4"/></svg></button>
<button type="button" class="rotate-button" data-rotate="clockwise" aria-label="Rotate tile in top-left space clockwise"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 11a7 7 0 0 1 13-3M18 4v4h-4"/></svg></button>
```

## 3. Event handling to change state

An event handler is a function that runs when an event occurs, such as a drag,
a drop, or a button click.

### Starting and ending a drag

The `dragstart` handler remembers the tile and identifies it in the drag data.
The `dragend` handler removes the dragging style and clears `draggedTile`:

```js
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
```

### Dropping a tile on the board

When a tile is dropped on a slot, the handler checks whether the drop can be
accepted. It then moves the tile, saves its new location, updates the slot
styles, and checks the circuit again:

```js
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
```

The tray has a separate `drop` handler that moves the tile into the tray,
sets its location to `"tray"`, and also updates the slot styles and circuit.

### Rotating a tile

The board's `click` handler finds the rotation button and its slot. If there
is a tile in that slot, it changes the rotation, updates the image and edges,
and rechecks the circuit:

```js
const state = tileStates[tile.dataset.tile];
state.rotation = button.dataset.rotate === "clockwise"
  ? (state.rotation + 1) % edges.length
  : (state.rotation - 1 + edges.length) % edges.length;
updateTile(tile);
updateCircuitCondition();
```

The rotation value wraps around four possible quarter-turns. `updateTile()`
rotates the picture and recalculates the current edge values so they stay
aligned with it.

## 4. Use of control flow

Control flow determines which code runs based on conditions. The app uses
`if`, `else`, logical operators, and conditional expressions to model the
circuit.

### Wire, resistor, and battery checks

The wire must be on the board with both inward-facing edges conducting:

```js
const wireAligned =
  wireLocation !== "tray" &&
  centerEdges[wireLocation].every((edge) => wireEdges[edge] === "conduct");
```

The resistor must have tiles in both neighboring slots, and its two inward
edges must have different values. Since its edge values are `A` and `B`, this
means one of each:

```js
if (resistorLocation !== "tray") {
  const touchingEdges = centerEdges[resistorLocation];
  const neighborsPresent = neighboringSlots[resistorLocation].every((slot) =>
    Object.values(tileLocations).includes(slot)
  );
  resistorConnected = neighborsPresent &&
    resistorEdges[touchingEdges[0]] !== resistorEdges[touchingEdges[1]];
}
```

The battery must also be on the board, with one `+` and one `-` edge facing
inward:

```js
if (batteryLocation !== "tray") {
  const inwardEdges = centerEdges[batteryLocation];
  batteryAligned = batteryEdges[inwardEdges[0]] !== batteryEdges[inwardEdges[1]];
}
```

### LED polarity

When the LED and battery are adjacent, the app compares the two touching
edges. Matching values produce `"polarity correct"`; different values produce
`"polarity incorrect"`:

```js
if (tileStates.led.edges[ledEdge] === batteryEdges[batteryEdge]) {
  ledCondition = "polarity correct";
} else {
  ledCondition = "polarity incorrect";
}
```

When they are diagonal, the app first requires both connecting slots to be
occupied. It then compares the battery and LED polarity along both paths:

```js
const matchingPolarity = paths.every((slot, index) => {
  const batteryEdge = centerEdges[batteryLocation][index];
  const ledEdge = centerEdges[ledLocation][neighboringSlots[ledLocation].indexOf(slot)];
  return batteryEdges[batteryEdge] === tileStates.led.edges[ledEdge];
});
ledCondition = matchingPolarity ? "polarity correct" : "polarity incorrect";
```

### Circuit result and visual feedback

The circuit is complete only when the wire, resistor, battery, and LED checks
all pass. The app then adds the `lit` class to the LED tile; otherwise it
removes the class. It also updates the LED's accessible label:

```js
const circuitComplete = wireAligned && resistorConnected && batteryAligned &&
  ledCondition === "polarity correct";

const led = document.querySelector("#led");
led.classList.toggle("lit", circuitComplete);
led.setAttribute("aria-label", circuitComplete ? "LED tile, lit" : "LED tile, off");
```

The CSS uses the `lit` class to show the green glow. Moving or rotating a tile
can break the circuit, causing the next check to turn the glow off.
