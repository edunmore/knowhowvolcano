#!/bin/bash
# Setup script for creating a new vault with all necessary files

set -e

# Check if vault directory is provided
if [ -z "$1" ]; then
    echo "Usage: ./setup-vault.sh <vault-directory>"
    echo "Example: ./setup-vault.sh ./my-vault"
    exit 1
fi

VAULT_DIR="$1"
TEMPLATE_VAULT="./src/systems/research/vault"

echo "🔧 Setting up vault at: $VAULT_DIR"

# Create vault directory
mkdir -p "$VAULT_DIR"

# Copy _system folder (runbooks, prompts, schemas)
echo "📄 Copying runbooks and prompts..."
cp -r "$TEMPLATE_VAULT/_system" "$VAULT_DIR/"

# Create index directories
echo "📁 Creating index directories..."
mkdir -p "$VAULT_DIR/_index"
mkdir -p "$VAULT_DIR/_sources"
mkdir -p "$VAULT_DIR/_runs"

# Create note type directories
echo "📂 Creating note type directories..."
for dir in concepts procedures principles misconceptions examples stories microlearnings learning_paths quizzes flashcards; do
    mkdir -p "$VAULT_DIR/$dir"
done

# Copy templates if they exist
if [ -d "$TEMPLATE_VAULT/microlearnings" ]; then
    echo "📋 Copying templates..."
    cp "$TEMPLATE_VAULT/microlearnings/_template.md" "$VAULT_DIR/microlearnings/" 2>/dev/null || true
    cp "$TEMPLATE_VAULT/learning_paths/_template.md" "$VAULT_DIR/learning_paths/" 2>/dev/null || true
    cp "$TEMPLATE_VAULT/quizzes/_template.md" "$VAULT_DIR/quizzes/" 2>/dev/null || true
    cp "$TEMPLATE_VAULT/flashcards/_template.md" "$VAULT_DIR/flashcards/" 2>/dev/null || true
fi

# Create vault metadata
echo "📝 Creating vault metadata..."
cat > "$VAULT_DIR/_system/vault.json" << EOF
{
  "version": "1.0",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "layout_version": "2.0"
}
EOF

echo "✅ Vault setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run extraction:"
echo "     npx tsx src/systems/research/cli.ts coordinate \\"
echo "       --runbook knowledge-extraction \\"
echo "       --file ./yourfile.md \\"
echo "       --vault $VAULT_DIR"
echo ""
echo "  2. Or test chunking:"
echo "     npx tsx src/systems/research/cli.ts run \\"
echo "       --runbook chunk-gate-test \\"
echo "       --file ./benchmark/benchmark_source_nohints.md \\"
echo "       --vault $VAULT_DIR"
