interface LineColumn {
  line: number;
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
  let prevLineIndex = 0;
  let nextLineIndex = source.indexOf("\n", prevLineIndex);

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
