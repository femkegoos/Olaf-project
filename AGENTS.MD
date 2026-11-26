## git commit message
- Use the present tense
- Use the imperative mood
- Limit the first line to 50 characters
- Wrap the second line at 72 characters
- Explain what the commit does, not what it changed
- Begin with feature, fix, docs, style, refactor, perf, test, chore, or revert

## shared syntax
use TSL in threejs

## code organization
- Check whether new or growing code belongs in a dedicated module or folder instead of an unrelated file; organize it there when that improves clarity.
- Regularly review the project structure and file responsibilities to keep the codebase easy to navigate and understand.

## security guidelines
never commit secrets, passwords, or sensitive information to the repository. Use environment variables or secret management tools to handle sensitive data securely.
