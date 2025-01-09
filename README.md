# PS5-PC Bridge

A sophisticated bridge for connecting PlayStation 5 controllers to PC games via USB-C, with advanced game integration capabilities powered by the Eliza framework.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Platform](https://img.shields.io/badge/platform-Windows%2011-lightgrey.svg)

## Overview

PS5-PC Bridge enables seamless integration between PlayStation 5 controllers and PC games through USB-C connectivity. The project leverages advanced memory analysis and pattern recognition to provide enhanced gaming experiences. Currently supporting GTA V with more games planned for future releases.

### Features

- **USB-C Connection**: Direct connection support for PS5 DualSense controllers
- **Low Latency**: Sub-5ms input latency for optimal gaming experience
- **Advanced Memory Integration**: Real-time game state analysis and interaction
- **Adaptive Triggers**: Full DualSense adaptive trigger support
- **Haptic Feedback**: Customizable haptic feedback profiles
- **Eliza Framework**: Built on the robust Eliza framework for game integration

## Current Game Support

### Grand Theft Auto V
- **Version Support**: v1.68 (Latest)
- **Features**:
  - Full controller mapping with adaptive triggers
  - Enhanced driving feedback through haptics
  - Real-time game state integration
  - Custom vibration profiles for different weapons
  - Advanced memory pattern detection for seamless integration
  - Automatic game state synchronization

## Requirements

### Hardware
- PlayStation 5 DualSense Controller
- USB-C cable (high-quality data cable recommended)
- Windows 11 PC with USB 3.0+ ports
- Minimum 8GB RAM
- SSD recommended for optimal performance

### Software
- Windows 11 (21H2 or later)
- Node.js v22.0.0+
- Visual C++ Redistributable 2022
- .NET Framework 4.8
- GTA V (Steam or Epic Games version)

## Installation

1. **Install Dependencies**:
\`\`\`bash
# Install required packages
pnpm install

# Run setup script
./scripts/setup.sh
\`\`\`

2. **Configure Environment**:
\`\`\`bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
\`\`\`

3. **Required Environment Variables**:
\`\`\`env
ELIZA_API_KEY=your_api_key_here
DEBUG_MODE=false
LOG_LEVEL=info
GAME_PATH=path_to_gta_installation
\`\`\`

## Usage

### Basic Setup
\`\`\`bash
# Start the bridge
pnpm start

# Start with debug logging
pnpm start --debug

# Start with specific game
pnpm start --game=gta
\`\`\`

### Advanced Configuration

The bridge can be fine-tuned through the \`config/default.json\` file:

\`\`\`json
{
  "controller": {
    "polling_rate": 1000,
    "deadzone": 0.05,
    "trigger_threshold": 0.15
  },
  "haptics": {
    "intensity": 0.8,
    "profile": "balanced"
  },
  "memory": {
    "scan_interval": 100,
    "pattern_cache": true
  }
}
\`\`\`

## Memory Pattern Documentation

### GTA V Integration
The bridge uses sophisticated memory pattern recognition to integrate with GTA V:

\`\`\`typescript
const PATTERNS = {
  base: '48 8B 05 ? ? ? ? 48 85 C0 74 ? 8B 80 ? ? ? ? C3',
  player: '48 8B 0D ? ? ? ? 48 85 C9 74 ? 8B 81 ? ? ? ? C3',
  vehicle: '48 89 5C 24 ? 48 89 74 24 ? 57 48 83 EC 20 48 8B F9'
};
\`\`\`

These patterns are continuously monitored and updated to maintain compatibility with game updates.

## Architecture

The project follows a modular architecture:

\`\`\`
src/
├── core/
│   ├── memory/      # Memory analysis and pattern matching
│   ├── input/       # Controller input processing
│   ├── network/     # Network communication
│   └── security/    # Security and encryption
├── agents/
│   └── gta/         # GTA V specific integration
├── lib/
│   └── eliza.ts     # Eliza framework integration
└── utils/
    └── logger.ts    # Logging and diagnostics
\`\`\`

## Security Considerations

The bridge implements several security measures:

- Memory access validation
- Pattern integrity checks
- Secure controller communication
- Anti-cheat compatibility layer
- Encrypted configuration storage

## Troubleshooting

### Common Issues

1. **Controller Not Detected**
   - Ensure USB-C cable supports data transfer
   - Check Windows USB driver installation
   - Verify controller firmware is updated

2. **High Latency**
   - Check USB port is 3.0+
   - Verify polling rate configuration
   - Disable power saving on USB ports

3. **Game Integration Errors**
   - Verify game version compatibility
   - Check memory pattern updates
   - Ensure antivirus exceptions are set

## Development

### Building from Source
\`\`\`bash
# Install development dependencies
pnpm install

# Build the project
pnpm run build

# Run tests
pnpm test
\`\`\`

### Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

Please ensure your PR:
- Follows the existing code style
- Includes appropriate tests
- Updates documentation as needed
- Maintains type safety

## Roadmap

### Short Term
- [ ] Enhanced haptic feedback profiles
- [ ] Custom trigger resistance curves
- [ ] Performance optimization for memory scanning
- [ ] Additional controller diagnostic tools

### Long Term
- [ ] Support for additional games
- [ ] Wireless connection support
- [ ] Custom profile editor
- [ ] Machine learning-based pattern detection

## Disclaimer

This project is for educational purposes only. It does not modify any game files or memory values, only reads game state for controller integration. Use at your own risk and ensure compliance with game terms of service.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Eliza Framework Team
- PlayStation 5 Controller Documentation
- GTA V Modding Community
- Memory Pattern Analysis Tools

## Support

For support, please:
1. Check the troubleshooting guide
2. Search existing issues
3. Create a new issue with detailed information

## Contact

For security concerns or private inquiries, contact the maintainers directly through GitHub.
