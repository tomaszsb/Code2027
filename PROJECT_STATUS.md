

---

## ⚠️ **Known Issues**

- **First Turn Sequence**: The startup logic in `GameLayout.tsx` has not been updated to use the unified `startTurn` service. As a result, the first turn of the game still processes events out of the correct sequence. All subsequent turns work as expected.