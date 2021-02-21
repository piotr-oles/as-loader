import { LineColumn } from "./line-column";

interface Location {
  start?: LineColumn;
  end?: LineColumn;
}

function formatLocation(location: Location): string {
  let formatted = "";
  if (location.start) {
    formatted += `${location.start.line}:${location.start.column}`;

    if (location.end) {
      if (location.end.line === location.start.line) {
        formatted += `-${location.end.column}`;
      } else {
        formatted += `-${location.end.line}:${location.end.column}`;
      }
    }
  }

  return formatted;
}

export { formatLocation, Location };
