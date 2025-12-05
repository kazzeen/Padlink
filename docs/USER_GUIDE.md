# User Guide: Profile Image Management

## Updating Your Profile Picture

1. **Navigate to Profile**: Go to your **Profile** page from the dashboard.
2. **Locate Avatar**: In the "Basic Info" section, you will see your current avatar or a placeholder.
3. **Select Image**: Click on the camera icon overlay or the avatar area to open the file selector.
   - **Supported formats**: JPG, PNG, GIF, WEBP.
   - **Max size**: 5MB.
   - **Min dimensions**: 100x100 pixels.
4. **Preview & Upload**: 
   - Once you select a file, a preview will appear immediately.
   - The system automatically uploads the image.
   - If successful, the new image will replace the old one.
   - If there is an error (e.g., file too large), an error message will appear.
5. **Save Profile**: The profile form will automatically update with the new image URL. You may need to click "Save Changes" if you made other edits, but the image upload is persisted immediately upon selection.

# Wallet Management

## Managing Your Wallet

1. **Access Wallet**: Click the "Wallet" icon in the sidebar navigation.
2. **Account Overview**: 
   - View your connected wallet address (click "Copy" to copy to clipboard).
   - See your current balance (ETH or SOL) and network status.
3. **Transaction History**: 
   - View recent transactions for Ethereum Mainnet and Solana Mainnet.
   - Click on a transaction to expand details.
   - **Note**: Transaction history relies on public APIs and may be rate-limited.
4. **Network Management**: 
   - Switch between Ethereum Mainnet and Solana Mainnet views by selecting the corresponding network button (requires connecting a wallet of that chain type).
   - Disconnect your wallet if needed.
5. **Refresh Data**: Click the "Refresh Data" button to update your balance and transaction history in real-time.

## Exporting Your Embedded Wallet

- You can export the private key for your embedded wallet multiple times without reloading the page. Each export attempt requires fresh authorization and the interface remains enabled after use.
- Keys are never cached by the app. Export state is reset after each reveal to prevent data persistence.
- Only embedded wallets created in the app can be exported. External wallets manage their own keys and typically do not reveal private keys.

### How to Export
- Open the Wallet page and select the desired network (Ethereum or Solana).
- Click `Export Ethereum Private Key` or `Export Solana Private Key`.
- Review the risk warning and click `Reveal Keys`.
- After completion, you may repeat the process as needed; concurrent attempts are blocked to prevent accidental duplicates.

### Security Guidelines
- Verify your authorization on every export attempt; if your session expires, re-authenticate when prompted.
- Do not store keys digitally. Write them down and keep them in a secure location.
- Never share your keys with anyone or any support agent.
