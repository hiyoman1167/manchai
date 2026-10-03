// Pure comparison logic shared by the real-IME practice and its checks.
(function () {
  const ignored = /^[\p{P}\p{Z}\s]$/u;
  const characters = text => Array.from(text).filter(character => !ignored.test(character));

  function compare(typedText, targetText) {
    const typed = characters(typedText);
    const target = characters(targetText);
    let correct = 0;
    while (correct < typed.length && correct < target.length && typed[correct] === target[correct]) correct++;
    return {
      typed,
      target,
      correct,
      hasError: correct < typed.length,
      complete: correct === target.length && typed.length === target.length,
      expected: target[correct] || "",
      actual: typed[correct] || ""
    };
  }

  globalThis.MANCHAI_TYPING = { characters, compare };
})();
