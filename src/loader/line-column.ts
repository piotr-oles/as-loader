interface LineColumn {
  // 1-based line
  line: number;
  // 1-based column
  column: number;
}

function getLineColumnFromIndex(
  source: string,
  index: number
): LineColumn | undefined {
  if (index < 0 || index >= source.length || isNaN(index)) {
    return undefined;
  }

  let line = 1;
  let prevLineIndex = -1;
  let nextLineIndex = source.indexOf("\n");

  while (nextLineIndex !== -1 && index > nextLineIndex) {
    prevLineIndex = nextLineIndex;
    nextLineIndex = source.indexOf("\n", prevLineIndex + 1);
    ++line;
  }
  const column = index - prevLineIndex;

  return {
    line,
    column,
  };
}

export { getLineColumnFromIndex, LineColumn };
