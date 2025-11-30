# Blood on the Clocktower Token Generator

🌐 **[Launch Web App](https://phauks.github.io/Clocktower_Token_Generator/)**

A web-based tool for generating custom Blood on the Clocktower character and reminder tokens with PDF export. Built with TypeScript for type safety and maintainability.

## Features

- **Token Generation**: Generate character tokens and reminder tokens from custom or official scripts
- **Trademark Token**: Automatic credit token for Blood on the Clocktower (generated with every token set)
- **Customizable Appearance**: Adjust token diameters, backgrounds, fonts, and colors
- **PDF Export**: Generate print-ready PDFs at 300 DPI with proper margins
- **ZIP Download**: Download all tokens as a ZIP archive organized by type
- **Filter & Sort**: Filter tokens by team type, token type, or reminder status
- **Curved Text**: Character names and reminder text curve along the bottom of tokens
- **Setup Flower Overlay**: Characters with setup modifications display decorative overlays
- **No Installation Required**: Runs entirely in your browser!

## Usage

Simply visit the link above - no download or installation needed!

## Development

### Prerequisites

- Node.js 18+ and npm

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Watch Mode (for development)

```bash
npm run watch
```

### Development Workflow

#### Daily Development

Start the development server with automatic browser refresh:

```bash
npm run dev
```

This runs TypeScript in watch mode and starts Vite dev server at http://localhost:7221.
Changes to TypeScript files automatically compile and refresh your browser.

#### Running Tests

```bash
# Run all tests once
npm test

# Watch mode (re-runs on changes)
npm run test:watch

# Visual UI for tests
npm run test:ui

# Coverage report
npm run test:coverage
```

#### Before Committing

Run pre-commit checks to ensure code quality:

```bash
npm run precommit
```

This runs type checking, unit tests, and build verification.

For faster checks during rapid development:

```bash
npm run precommit:quick
```

#### Before Releasing

Run full validation before tagging a release:

```bash
npm run prerelease
```

Follow the E2E testing checklist that appears after running this command.

#### Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with auto-refresh |
| `npm run dev:test` | Development server + test watch mode |
| `npm run lint` | Type check TypeScript without building |
| `npm run precommit` | Run all pre-commit checks |
| `npm run prerelease` | Full release validation |
| `npm run validate` | Run CI-equivalent checks locally |
| `npm run preview` | Preview production build locally |

#### Troubleshooting

**Dev server won't start**
- Check if port 7221 is in use
- Try: `npm run dev:serve -- --port 3000`

**TypeScript errors but code works**
- Run: `npm run build` to see full errors
- Check: `tsconfig.json` for strict settings

**Tests failing**
- Run: `npm run test:ui` for detailed view
- Check: Browser console for runtime errors

**Changes not reflecting**
- Hard refresh: Ctrl+Shift+R (Windows)
- Clear dist: `npm run clean && npm run build`

### Project Structure

```
/src/ts/          # TypeScript source files
/dist/js/         # Compiled JavaScript (gitignored, generated on build)
/assets/          # Fonts, images, backgrounds
/css/             # Stylesheets
/example_scripts/ # Example JSON scripts
```

### Type Safety

This project uses TypeScript with strict type checking enabled. All data structures are properly typed for better IDE support and error prevention.

### Generating Tokens

1. **Input a Script**:
   - Upload a JSON file using the file upload button
   - Paste JSON directly into the editor
   - Select an example script from the dropdown

2. **Configure Options** (Optional):
   - Adjust token diameters for character and reminder tokens
   - Enable ability text display on character tokens
   - Show reminder count badges on character tokens
   - Choose background patterns and setup flower styles
   - Set reminder token background color
   - Select fonts for character names and reminder text

3. **Generate**:
   - Click "Generate Tokens" to create all tokens
   - Tokens appear in a grid view with previews

4. **Export**:
   - Click individual tokens to download as PNG
   - Use "Download All (ZIP)" for batch download
   - Use "Generate PDF" for print-ready output

## JSON Format

### Simple Format (ID References)

```json
[
  { "id": "washerwoman" },
  { "id": "librarian" },
  { "id": "fortune_teller" }
]
```

### Full Format (Custom Characters)

```json
[
  {
    "id": "_meta",
    "name": "My Script",
    "author": "Your Name"
  },
  {
    "id": "custom_char",
    "name": "Custom Character",
    "team": "townsfolk",
    "ability": "You have a custom ability.",
    "image": "https://example.com/image.png",
    "setup": false,
    "reminders": ["Reminder 1", "Reminder 2"]
  }
]
```

### Character Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (required) |
| `name` | string | Display name (required) |
| `team` | string | Team type: townsfolk, outsider, minion, demon, traveller, fabled, loric |
| `ability` | string | Character ability text |
| `image` | string/array | URL to character image |
| `setup` | boolean | Whether character affects game setup |
| `reminders` | array | Array of reminder token strings |

## Configuration Options

### Token Generation

| Option | Default | Description |
|--------|---------|-------------|
| Display Ability Text | OFF | Show ability text on character tokens |
| Character Token Diameter | 300px | Size of character tokens |
| Reminder Token Diameter | 525px | Size of reminder tokens |
| Show Reminder Count | OFF | Display count badge on character tokens |

### Style Options

| Option | Default | Description |
|--------|---------|-------------|
| Setup Flower Style | Setup Flower 1 | Decorative overlay for setup characters |
| Reminder Background | #FFFFFF | Background color for reminder tokens |
| Character Background | Background 1 | Background pattern for character tokens |
| Character Name Font | Dumbledor | Font for character names |
| Reminder Text Font | Trade Gothic | Font for reminder text |

### PDF Generation

| Option | Default | Description |
|--------|---------|-------------|
| Token Padding | 75px | Space between tokens |
| X Offset | 0px | Horizontal offset for token placement |
| Y Offset | 0px | Vertical offset for token placement |

## PDF Specifications

- **Page Size**: 8.5" × 11" (Letter)
- **Resolution**: 300 DPI
- **Margins**: 0.25" on all sides
- **Layout**: Grid (left-to-right, top-to-bottom)

## Browser Support

- Google Chrome (recommended)
- Mozilla Firefox
- Safari
- Microsoft Edge

## Dependencies

External libraries loaded via CDN:
- [jsPDF](https://github.com/parallax/jsPDF) 2.5.1 - PDF generation
- [JSZip](https://stuk.github.io/jszip/) 3.10.1 - ZIP file creation
- [FileSaver.js](https://github.com/eligrey/FileSaver.js/) 2.0.5 - File downloads
- [QRCode.js](https://davidshimjs.github.io/qrcodejs/) 1.0.0 - QR code generation for almanac tokens

## Credits

- Blood on the Clocktower is a trademark of The Pandemonium Institute
- Character data sourced from the official Blood on the Clocktower API
- Fonts: Dumbledor, Trade Gothic
- A trademark token is automatically generated with every token set to credit The Pandemonium Institute

## Architecture

### Technology Stack

- **TypeScript 5.3+** with strict type checking
- **ES2020 modules** for modern JavaScript features
- **HTML5 Canvas API** for token rendering
- **Client-side only** - no backend required

### Module Structure

```
src/ts/
├── main.ts              - Application entry point and initialization
├── ui.ts                - UI controller and event handling
├── tokenGenerator.ts    - Canvas-based token rendering engine
├── pdfGenerator.ts      - PDF and ZIP export functionality
├── dataLoader.ts        - Data fetching and JSON parsing
├── config.ts            - Configuration constants and defaults
├── presets.ts           - UI preset configurations
├── utils.ts             - Utility functions (debounce, image loading, etc.)
└── types/index.ts       - TypeScript type definitions
```

### Data Flow

1. **Input**: User provides JSON (upload/paste/example)
2. **Parsing**: `dataLoader.ts` validates and merges with official character data
3. **Generation**: `tokenGenerator.ts` creates canvas elements for each token
4. **Display**: `ui.ts` filters and renders tokens in grid view
5. **Export**: `pdfGenerator.ts` converts tokens to PNG/ZIP/PDF

### CI/CD Workflows

The project uses GitHub Actions for:
- **Build verification** on all PRs (Node.js 18.x and 20.x)
- **Code quality checks** (TypeScript type checking)
- **Automatic versioning** (patch version bump on main commits)
- **Deployment** to GitHub Pages
- **Security audits** (weekly dependency checks)
- **Release creation** with ZIP artifacts

## Troubleshooting

### Common Issues

**Q: Tokens are not generating**
- Ensure your JSON is valid (use the "Beautify JSON" button)
- Check browser console for error messages
- Verify character IDs match official characters or include full character objects

**Q: Character images not loading**
- Images must be publicly accessible URLs
- CORS restrictions may block some images
- Try using images from official sources or CORS-enabled hosts

**Q: PDF is blank or incomplete**
- Ensure all images have loaded before generating PDF
- Try reducing the number of tokens per page using token padding
- Check browser console for errors

**Q: ZIP download not working**
- Ensure pop-ups are not blocked in your browser
- Try disabling browser extensions that might interfere
- Check browser console for errors

**Q: Fonts look incorrect**
- Fonts load automatically on app start
- Some browsers may need a page refresh
- Check Network tab to ensure font files loaded successfully

### Performance Tips

- **Large scripts**: Generation time increases with token count (especially reminder tokens)
- **Image caching**: First generation is slower; subsequent generations use cached images
- **PDF generation**: Can be slow for 50+ tokens; be patient and watch progress indicator
- **Browser choice**: Chrome and Edge typically have best Canvas performance

## Contributing

### Code Quality Standards

This project maintains high code quality standards:

**Naming Conventions:**
- **Files**: camelCase (e.g., `tokenGenerator.ts`)
- **Variables/Functions**: camelCase (e.g., `generateToken()`)
- **Classes**: PascalCase (e.g., `TokenGenerator`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `CONFIG`)
- **Types/Interfaces**: PascalCase (e.g., `Character`)

**TypeScript:**
- Strict type checking enabled
- All public functions should have type annotations
- Use interfaces/types from `types/index.ts`
- No `any` types unless absolutely necessary

**Code Organization:**
- Keep functions focused and under 100 lines when possible
- Extract reusable logic to utility functions
- Use meaningful variable and function names
- Add JSDoc comments for exported functions

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes in `src/ts/`
4. Build and test locally (`npm run build`)
5. Ensure TypeScript compiles without errors
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to your branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Testing Locally

```bash
# Install dependencies
npm install

# Start development server (recommended)
npm run dev

# OR: Build and serve manually
npm run build
# Then use VS Code Live Server, Python's http.server, or similar
```

For comprehensive testing before commits, see the "Development Workflow" section above.

### Pull Request Guidelines

- Ensure all TypeScript compiles without errors
- Follow existing code style and naming conventions
- Update README if adding new features
- Add entries to CHANGELOG.md
- Keep commits focused and atomic
- Write clear commit messages

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.

## License

See [LICENSE](LICENSE) file for details.

## Advanced Features

### Meta Tokens

The generator automatically creates special meta tokens for each script:

- **Pandemonium Institute Credit Token**: Automatically generated with every token set to properly credit The Pandemonium Institute
- **Script Name Token**: Generated when your JSON includes a `_meta` entry with script name and author
- **Almanac QR Code Token**: Generated when your JSON includes an `almanacUrl` field in the `_meta` entry

Example meta entry:
```json
{
  "id": "_meta",
  "name": "My Custom Script",
  "author": "Your Name",
  "almanacUrl": "https://example.com/almanac"
}
```

### Image Caching

Character images are automatically cached in memory to improve performance when generating multiple tokens. The cache persists across token generation sessions.

### Progress Tracking

When generating large token sets or PDFs, the application provides real-time progress updates showing the current operation status.

## To Be Implemented (TBI)

The following features are planned but not yet implemented:
- Decorative leaf generation and probability system (referenced in config)
- Official vs custom character filtering in the UI
- Additional preset configurations (Full Bloom and Minimal are partially implemented)
- Light theme and high contrast theme options
- A4 paper size support for PDF generation
- Custom DPI configuration for PDF export