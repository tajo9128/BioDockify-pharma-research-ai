#!/bin/bash

# BioDockify AI - Complete Setup Script
# Handles dependencies, icons, and initial build

set -e  # Exit on error

echo "🚀 BioDockify AI - Tauri Desktop Setup"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Step 1: Install Bun dependencies
echo ""
print_info "Step 1: Installing Node.js dependencies..."
if bun install --silent; then
    print_success "Node.js dependencies installed"
else
    print_error "Failed to install Node.js dependencies"
    exit 1
fi

# Step 2: Check Rust installation
echo ""
print_info "Step 2: Checking Rust installation..."
if command -v rustc &> /dev/null; then
    RUST_VERSION=$(rustc --version)
    print_success "Rust is installed: $RUST_VERSION"
else
    print_warning "Rust is not installed"
    echo "Rust is required for Tauri development."
    echo ""
    echo "Install Rust:"
    case "$(uname -s)" in
        Linux)
            echo "  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
            echo "  source $HOME/.cargo/env"
            ;;
        Darwin)
            echo "  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
            ;;
        MINGW*|MSYS*|CYGWIN*)
            echo "  Download from: https://rustup.rs/"
            ;;
    esac
    echo ""
    read -p "Install Rust now? (y/n) " -n 1 -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        case "$(uname -s)" in
            Linux)
                curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
                source $HOME/.cargo/env
                ;;
            Darwin)
                curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
                ;;
        esac
        print_success "Rust installed"
    fi
fi

# Step 3: Check system dependencies
echo ""
print_info "Step 3: Checking system dependencies..."

# Detect OS
OS_TYPE=$(uname -s)

case $OS_TYPE in
    Linux)
        print_info "Detected Linux system"
        
        # Check for common Linux distributions
        if [ -f /etc/debian_version ]; then
            DISTRO="Debian/Ubuntu"
            PKG_MANAGER="apt-get"
        elif [ -f /etc/redhat-release ]; then
            DISTRO="Fedora/CentOS"
            PKG_MANAGER="dnf"
        elif [ -f /etc/arch-release ]; then
            DISTRO="Arch Linux"
            PKG_MANAGER="pacman"
        fi
        
        print_info "Distribution: $DISTRO"
        
        echo "Required packages for Tauri on Linux:"
        case $DISTRO in
            Debian/Ubuntu)
                echo "  - libwebkit2gtk-4.1-dev"
                echo "  - build-essential"
                echo "  - curl"
                echo "  - wget"
                echo "  - libssl-dev"
                echo "  - libayatana-appindicator3-dev"
                echo "  - librsvg2-dev"
                ;;
            Fedora/CentOS)
                echo "  - webkit2gtk4.1-devel"
                echo "  - openssl-devel"
                echo "  - curl"
                echo "  - wget"
                echo "  - libappindicator-gtk3"
                echo "  - librsvg2-devel"
                ;;
            Arch\ Linux)
                echo "  - webkit2gtk-4.1"
                echo "  - openssl"
                echo "  - curl"
                echo "  - wget"
                echo "  - librsvg2"
                ;;
        esac
        
        read -p "Install system dependencies now? (Requires sudo) (y/n) " -n 1 -r
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sudo $PKG_MANAGER install -y \
                libwebkit2gtk-4.1-dev \
                build-essential \
                curl \
                wget \
                libssl-dev \
                libayatana-appindicator3-dev \
                librsvg2-dev 2>/dev/null || true
            
            if [ $? -eq 0 ]; then
                print_success "System dependencies installed"
            else
                print_error "Failed to install system dependencies"
                exit 1
            fi
        fi
        ;;
    
    Darwin)
        print_success "macOS detected - No additional system dependencies needed"
        ;;
    
    MINGW*|MSYS*|CYGWIN*)
        print_success "Windows detected - No additional system dependencies needed"
        ;;
esac

# Step 4: Generate Icons
echo ""
print_info "Step 4: Generating application icons..."

if [ -f "desktop/generate-icons.sh" ]; then
    chmod +x desktop/generate-icons.sh
    bash desktop/generate-icons.sh
    
    if [ -f "desktop/icons/128x128.png" ]; then
        print_success "Icons generated successfully"
    else
        print_warning "Icon generation may have failed. Using SVG directly."
    fi
else
    print_warning "Icon generation script not found. Use 'bun run tauri:icon' instead."
fi

# Step 5: Build Next.js
echo ""
print_info "Step 5: Building Next.js application..."

# Clean previous build
if [ -d ".next" ]; then
    echo "Cleaning previous build..."
    rm -rf .next
fi

# Build Next.js
if bun run build; then
    print_success "Next.js build completed"
else
    print_error "Next.js build failed"
    exit 1
fi

# Step 6: Database Setup
echo ""
print_info "Step 6: Setting up database..."

# Check if Prisma is set up
if [ -f "prisma/schema.prisma" ]; then
    print_info "Running Prisma migrations..."
    
    # Try to generate Prisma client
    bun run db:generate
    
    # Push schema to database
    if bun run db:push; then
        print_success "Database setup completed"
    else
        print_warning "Database setup failed. You may need to run this manually."
    fi
else
    print_warning "No Prisma schema found. Skipping database setup."
fi

# Step 7: Summary
echo ""
echo "============================================"
print_success "Setup completed!"
echo ""
echo "Next steps:"
echo ""
echo "  🖥️  Development mode:"
echo "      bun run tauri"
echo ""
echo "  🏗️  Production build:"
echo "      bun run tauri:build"
echo ""
echo "  📦  Create tar archive:"
echo "      bun run tar"
echo ""
echo "  📚  Documentation:"
echo "      See desktop/README.md for detailed information"
echo ""
echo "  🎨  Regenerate icons:"
echo "      bun run tauri:icon"
echo ""
echo "============================================"
