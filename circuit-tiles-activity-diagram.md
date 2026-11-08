# Circuit Tiles Activity Diagram

## Arranging Tiles and Completing the Circuit

This activity diagram describes the current circuit-tile app. A user arranges
and rotates four tiles on a 2-by-2 board. The app checks the tile positions
and edge values and lights the LED when all circuit conditions are met.

The diagram uses **BRANCH**, **ALTERNATIVE**, and **MERGE** nodes like the
example. It does not use a **FORK** or **JOIN**: the app does not split this
workflow into parallel actions.

```text
================================================================================
STAGE 1: InitializeCircuit
================================================================================
[ Start App ]
       |
       v
InitializeTiles
  - Place battery, LED, resistor, and bent wire in the tray
  - Set each tile's rotation and starting edge values
       |
       v
CheckCircuit
  - The initial circuit is broken and the LED is off
       |
       v
( MERGE 1 ) <-------------------- Return here after an action or circuit check
       |
       v
WaitForUserAction
       |
       v
================================================================================
STAGE 2: ArrangeAndRotateTiles
================================================================================
                +----------+
                | BRANCH 1 | (What did the user do?)
                +----+-----+
                     |
       +-------------+---------------+----------------+
       |                             |                |
       v                             v                v
ALTERNATIVE A                  ALTERNATIVE B    ALTERNATIVE C
[Drop tile on a slot]          [Drop in tray]   [Click rotation button]
       |                             |                |
       v                             v                v
Is slot empty or does          Move tile to     Does slot contain
it contain this tile?          the tray         a tile?
   |          |                      |             |          |
  Yes         No                     |            Yes         No
   |          |                      |             |          |
   v          v                      v             v          v
Move tile   No change          Save location    Rotate tile  No change
to slot        |               and update       90 degrees      |
   |           |               slot styles      and update      |
   v           |                     |          edge values     |
Save location  |                     |             |            |
and update     |                     |             |            |
slot styles    |                     |             |            |
   |           |                     |             |            |
   +-----------|---------------------+-------------+            |
               |                     |                          |
               |                     v                          |
               |                ( MERGE 2 )                     |
               |                     |                          |
               |                     v                          |
               |                CheckCircuit                    |
               |                (go to STAGE 3)                 |
               |                                                |
               +--------------------+---------------------------+
                                    |
                                    v
                              ( MERGE 1 )

An invalid drop, an empty-slot rotation, or a cancelled drag leaves the
tile arrangement unchanged. Return to MERGE 1 and wait for another action.

================================================================================
STAGE 3: CheckCircuit
================================================================================
[ CheckCircuit ]
       |
       v
CheckBentWire
  - The wire is on the board and both conductive edges face the center.
  - Record wire aligned or not aligned.
       |
       v
CheckResistor
  - The resistor is on the board and both neighboring slots contain tiles.
  - Its two inward-facing edges are different: one A and one B.
  - Record resistor connected or broken connection.
       |
       v
CheckBattery
  - The battery is on the board.
  - Its two inward-facing edges have different polarities: one + and one -.
  - Record battery aligned, not aligned, or not placed.
       |
       v
                +----------+
                | BRANCH 2 | (Where are the LED and battery?)
                +----+-----+
                     |
       +-------------+----------------+------------------+
       |                              |                  |
       v                              v                  v
ALTERNATIVE D                   ALTERNATIVE E      ALTERNATIVE F
[Adjacent on board]             [Diagonal on board] [One or both in tray]
       |                              |                  |
       v                              v                  v
Compare their touching         Are both connecting  Record LED as
edge polarities                slots occupied?      not touching battery
       |                         |          |            |
       v                        Yes         No           |
Record polarity                  |          |            |
correct or incorrect             v          v            |
       |                   Compare the   Record waiting  |
       |                   battery and   for connecting  |
       |                   LED polarity  tiles           |
       |                   along both       |            |
       |                   paths            |            |
       |                        |           |            |
       |                        v           |            |
       |                   Record polarity  |            |
       |                   correct only if  |            |
       |                   both paths match |            |
       |                        |           |            |
       +------------------------+-----------+------------+
                                |
                                v
                           ( MERGE 3 )
                                |
                                v
                     +----------+
                     | BRANCH 3 | (Do all circuit checks pass?)
                     +----+-----+
                          |
                +---------+----------+
                |                    |
                v                    v
         ALTERNATIVE G        ALTERNATIVE H
         [All checks pass]    [Any check does not pass]
                |                    |
                v                    v
         Set circuit to       Set circuit to
         complete circuit     broken circuit
         and light the LED    and turn the LED off
                |                    |
                +---------+----------+
                          |
                          v
                     ( MERGE 4 )
                          |
                          v
                     ( MERGE 1 )
                 Wait for another action
```

### Activity Diagram Elements

| Element | Purpose in this activity |
| :--- | :--- |
| **InitializeTiles** | Sets the starting location, rotation, and edge values for each tile. |
| **BRANCH 1 / ALTERNATIVES A-C** | Selects the path for a drop on the board, a return to the tray, or a rotation. |
| **MERGE 2** | Brings successful tile changes together before checking the circuit. |
| **BRANCH 2 / ALTERNATIVES D-F** | Selects the LED polarity check based on the LED and battery locations. |
| **BRANCH 3 / ALTERNATIVES G-H** | Selects the LED feedback based on the combined circuit conditions. |
| **MERGE 1 / MERGE 4** | Returns the activity to waiting for the user's next action. |