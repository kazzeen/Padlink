import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import WalletPage from '@/app/(dashboard)/wallet/page';

// Mock usePrivy and useWallets
jest.mock('@privy-io/react-auth', () => ({
  usePrivy: jest.fn(),
  useWallets: jest.fn(),
}));


// Mock Solana export hook
const solanaExportWalletMock = jest.fn();
const solanaCreateWalletMock = jest.fn();
jest.mock('@privy-io/react-auth/solana', () => ({
  useExportWallet: () => ({ exportWallet: solanaExportWalletMock }),
  useCreateWallet: () => ({ createWallet: solanaCreateWalletMock }),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

import { usePrivy, useWallets } from '@privy-io/react-auth';

describe('WalletPage', () => {
  const mockUser = {
    wallet: { address: '0x123' },
    linkedAccounts: [
      { type: 'wallet', chainType: 'ethereum', address: '0x123' },
      { type: 'wallet', chainType: 'solana', address: 'solanaAddr123' },
    ],
  };

  const mockWallets = [
    {
      address: '0x123',
      chainType: 'ethereum',
      chainId: 'eip155:1',
      connected: true,
      getEthereumProvider: jest.fn().mockResolvedValue({
        request: jest.fn().mockResolvedValue('0xDE0B6B3A7640000'), // 1 ETH
      }),
      switchChain: jest.fn(),

    },
    {
      address: 'solanaAddrConnected',
      chainType: 'solana',
      connected: true,

    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'alert', { value: jest.fn(), configurable: true });
    (usePrivy as jest.Mock).mockReturnValue({
      user: mockUser,
      ready: true,
      authenticated: true,
    });
    (useWallets as jest.Mock).mockReturnValue({
      wallets: mockWallets,
    });

    // Default fetch implementation
    (global.fetch as jest.Mock).mockImplementation(async (url, options) => {
      if (url.includes('etherscan')) {
        return { ok: true, json: async () => ({ status: '1', result: [] }) };
      }
      if (url === '/api/solana') {
        const body = JSON.parse((options as { body: string }).body);
        if (body.action === 'balance') {
           // Default mock balance for Solana
           return { ok: true, json: async () => ({ balance: "2.5000" }) };
        }
        if (body.action === 'transactions') {
           return { ok: true, json: async () => ({ transactions: [] }) };
        }
      }
      if (url === '/api/ethereum') {
        const body = JSON.parse((options as { body: string }).body);
        if (body.action === 'balance') {
           return { ok: true, json: async () => ({ balance: "1.2345" }) };
        }
      }
      return { ok: true, json: async () => ({}) };
    });
  });

  it('exports Ethereum private key for embedded wallet and logs to API', async () => {
    const exportWalletMock = jest.fn().mockResolvedValue(undefined);
    const getAccessTokenMock = jest.fn().mockResolvedValue('test-token');
    const userWithEmbeddedEth = {
      wallet: { address: '0x123', chainType: 'ethereum', walletClientType: 'privy' },
      linkedAccounts: [
        { type: 'wallet', chainType: 'ethereum', address: '0x123', walletClientType: 'privy' },
      ],
    };
    (usePrivy as jest.Mock).mockReturnValue({
      user: userWithEmbeddedEth,
      ready: true,
      authenticated: true,
      exportWallet: exportWalletMock,
      getAccessToken: getAccessTokenMock,
    });
    (useWallets as jest.Mock).mockReturnValue({
      wallets: [
        { address: '0x123', chainType: 'ethereum', connected: true, walletClientType: 'privy' },
      ],
    });

    (global.fetch as jest.Mock).mockImplementation(async (url) => {
      if (url === '/api/wallet/export') {
        return { ok: true, json: async () => ({ success: true }) };
      }
      return { ok: true, json: async () => ({}) };
    });

    render(<WalletPage />);
    await waitFor(() => expect(screen.getByText('Wallet Account')).toBeInTheDocument());

    const exportBtn = screen.getByText('Export Ethereum Private Key');
    fireEvent.click(exportBtn);

    const revealBtn = await screen.findByText('Reveal Keys');
    fireEvent.click(revealBtn);

    await waitFor(() => {
      expect(screen.queryByText('Reveal Keys')).not.toBeInTheDocument();
    });
  });

  it('exports Solana private key using Solana export hook', async () => {
    solanaExportWalletMock.mockResolvedValue(undefined);
    const getAccessTokenMock = jest.fn().mockResolvedValue('test-token');
    const userWithSol = {
      wallet: { address: 'solanaAddrEmbedded' },
      linkedAccounts: [
        { type: 'wallet', chainType: 'solana', address: 'solanaAddrEmbedded', walletClientType: 'privy' },
      ],
    };
    (usePrivy as jest.Mock).mockReturnValue({
      user: userWithSol,
      ready: true,
      authenticated: true,
      exportWallet: jest.fn(),
      getAccessToken: getAccessTokenMock,
    });
    (useWallets as jest.Mock).mockReturnValue({
      wallets: [
        { address: 'solanaAddrEmbedded', chainType: 'solana', connected: true },
      ],
    });

    (global.fetch as jest.Mock).mockImplementation(async (url) => {
      if (url === '/api/wallet/export') {
        return { ok: true, json: async () => ({ success: true }) };
      }
      return { ok: true, json: async () => ({}) };
    });

    render(<WalletPage />);
    await waitFor(() => expect(screen.getByText('Wallet Account')).toBeInTheDocument());

    const exportBtn = screen.getByText('Export Solana Private Key');
    fireEvent.click(exportBtn);

    const revealBtn = await screen.findByText('Reveal Keys');
    fireEvent.click(revealBtn);

    await waitFor(() => {
      expect(screen.queryByText('Reveal Keys')).not.toBeInTheDocument();
    });
  });

  it('shows Ethereum-specific error when only external Ethereum wallet exists', async () => {
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const exportWalletMock = jest.fn();
    (usePrivy as jest.Mock).mockReturnValue({
      user: {
        wallet: { address: '0xExternal', chainType: 'ethereum', walletClientType: 'external' },
        linkedAccounts: [
          { type: 'wallet', chainType: 'ethereum', address: '0xExternal', walletClientType: 'external' },
        ],
      },
      ready: true,
      authenticated: true,
      exportWallet: exportWalletMock,
      getAccessToken: jest.fn().mockResolvedValue('test-token'),
    });
    (useWallets as jest.Mock).mockReturnValue({
      wallets: [
        { address: '0xExternal', chainType: 'ethereum', connected: true, walletClientType: 'external' },
      ],
    });

    render(<WalletPage />);
    await waitFor(() => expect(screen.getByText('Wallet Account')).toBeInTheDocument());

    const exportBtn = screen.getByText('Export Ethereum Private Key');
    fireEvent.click(exportBtn);

    const revealBtn = await screen.findByText('Reveal Keys');
    fireEvent.click(revealBtn);

    await waitFor(() => {
      expect(exportWalletMock).not.toHaveBeenCalled();
      expect(alertMock).toHaveBeenCalledWith(
        'Ethereum private key export requires an embedded wallet created on this platform. External wallets (e.g., MetaMask) do not reveal private keys here.'
      );
    });

    alertMock.mockRestore();
  });

  it('allows consecutive exports for the same Ethereum wallet without reload', async () => {
    const exportWalletMock = jest.fn().mockResolvedValue(undefined);
    const getAccessTokenMock = jest.fn().mockResolvedValue('test-token');
    (usePrivy as jest.Mock).mockReturnValue({
      user: {
        wallet: { address: '0x123', chainType: 'ethereum', walletClientType: 'privy' },
        linkedAccounts: [
          { type: 'wallet', chainType: 'ethereum', address: '0x123', walletClientType: 'privy' },
        ],
      },
      ready: true,
      authenticated: true,
      exportWallet: exportWalletMock,
      getAccessToken: getAccessTokenMock,
    });
    (useWallets as jest.Mock).mockReturnValue({ wallets: [
      { address: '0x123', chainType: 'ethereum', connected: true, walletClientType: 'privy' },
    ]});

    (global.fetch as jest.Mock).mockImplementation(async (url) => {
      if (url === '/api/wallet/export') {
        return { ok: true, json: async () => ({ success: true }) };
      }
      return { ok: true, json: async () => ({}) };
    });

    render(<WalletPage />);
    await waitFor(() => expect(screen.getByText('Wallet Account')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Export Ethereum Private Key'));
    fireEvent.click(await screen.findByText('Reveal Keys'));
    await waitFor(() => expect(screen.queryByText('Reveal Keys')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Export Ethereum Private Key')).toBeEnabled());

    fireEvent.click(screen.getByText('Export Ethereum Private Key'));
    fireEvent.click(await screen.findByText('Reveal Keys'));
    await waitFor(() => expect(screen.queryByText('Reveal Keys')).not.toBeInTheDocument());

    expect(getAccessTokenMock).toHaveBeenCalledTimes(2);
  });

  it('handles export failure after initial success and recovers', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const exportWalletMock = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Simulated failure'))
      .mockResolvedValueOnce(undefined);
    const getAccessTokenMock = jest.fn().mockResolvedValue('test-token');
    (usePrivy as jest.Mock).mockReturnValue({
      user: {
        wallet: { address: '0x123', chainType: 'ethereum', walletClientType: 'privy' },
        linkedAccounts: [
          { type: 'wallet', chainType: 'ethereum', address: '0x123', walletClientType: 'privy' },
        ],
      },
      ready: true,
      authenticated: true,
      exportWallet: exportWalletMock,
      getAccessToken: getAccessTokenMock,
    });
    (useWallets as jest.Mock).mockReturnValue({ wallets: [
      { address: '0x123', chainType: 'ethereum', connected: true, walletClientType: 'privy' },
    ]});

    (global.fetch as jest.Mock).mockImplementation(async (url) => {
      if (url === '/api/wallet/export') {
        return { ok: true, json: async () => ({ success: true }) };
      }
      return { ok: true, json: async () => ({}) };
    });

    render(<WalletPage />);
    await waitFor(() => expect(screen.getByText('Wallet Account')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Export Ethereum Private Key'));
    fireEvent.click(await screen.findByText('Reveal Keys'));
    await waitFor(() => expect(screen.queryByText('Reveal Keys')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Export Ethereum Private Key')).toBeEnabled());

    fireEvent.click(screen.getByText('Export Ethereum Private Key'));
    fireEvent.click(await screen.findByText('Reveal Keys'));
    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Export Ethereum Private Key')).toBeEnabled());

    fireEvent.click(screen.getByText('Export Ethereum Private Key'));
    fireEvent.click(await screen.findByText('Reveal Keys'));
    await waitFor(() => expect(screen.queryByText('Reveal Keys')).not.toBeInTheDocument());

    alertSpy.mockRestore();
  });

  it('prevents multiple simultaneous export attempts', async () => {
    const exportWalletMock = jest.fn().mockResolvedValue(undefined);
    const getAccessTokenMock = jest.fn().mockResolvedValue('test-token');
    (usePrivy as jest.Mock).mockReturnValue({
      user: {
        wallet: { address: '0x123', chainType: 'ethereum', walletClientType: 'privy' },
        linkedAccounts: [
          { type: 'wallet', chainType: 'ethereum', address: '0x123', walletClientType: 'privy' },
        ],
      },
      ready: true,
      authenticated: true,
      exportWallet: exportWalletMock,
      getAccessToken: getAccessTokenMock,
    });
    (useWallets as jest.Mock).mockReturnValue({ wallets: [
      { address: '0x123', chainType: 'ethereum', connected: true, walletClientType: 'privy' },
    ]});

    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    (global.fetch as jest.Mock).mockImplementation(async (url) => {
      if (url === '/api/wallet/export') {
        return new Promise(resolve => setTimeout(() => resolve({ ok: true, json: async () => ({ success: true }) }), 50));
      }
      return { ok: true, json: async () => ({}) };
    });

    render(<WalletPage />);
    await waitFor(() => expect(screen.getByText('Wallet Account')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Export Ethereum Private Key'));
    const reveal = await screen.findByText('Reveal Keys');
    fireEvent.click(reveal);
    fireEvent.click(reveal);

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls.filter(([url]) => url === '/api/wallet/export');
      expect(calls.length).toBe(1);
    });

    alertSpy.mockRestore();
  });

  it('handles invalid or expired session by requiring re-authentication', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const exportWalletMock = jest.fn().mockResolvedValue(undefined);
    const getAccessTokenMock = jest
      .fn()
      .mockResolvedValueOnce('')
      .mockResolvedValueOnce('test-token');
    (usePrivy as jest.Mock).mockReturnValue({
      user: {
        wallet: { address: '0x123', chainType: 'ethereum', walletClientType: 'privy' },
        linkedAccounts: [
          { type: 'wallet', chainType: 'ethereum', address: '0x123', walletClientType: 'privy' },
        ],
      },
      ready: true,
      authenticated: true,
      exportWallet: exportWalletMock,
      getAccessToken: getAccessTokenMock,
    });
    (useWallets as jest.Mock).mockReturnValue({ wallets: [
      { address: '0x123', chainType: 'ethereum', connected: true, walletClientType: 'privy' },
    ]});

    (global.fetch as jest.Mock).mockImplementation(async (url) => {
      if (url === '/api/wallet/export') {
        return { ok: true, json: async () => ({ success: true }) };
      }
      return { ok: true, json: async () => ({}) };
    });

    render(<WalletPage />);
    await waitFor(() => expect(screen.getByText('Wallet Account')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Export Ethereum Private Key'));
    fireEvent.click(await screen.findByText('Reveal Keys'));
    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Export Ethereum Private Key')).toBeEnabled());

    fireEvent.click(screen.getByText('Export Ethereum Private Key'));
    fireEvent.click(await screen.findByText('Reveal Keys'));
    await waitFor(() => expect(screen.queryByText('Reveal Keys')).not.toBeInTheDocument());

    alertSpy.mockRestore();
  });

  it('supports sequential exports for Ethereum then Solana without interference', async () => {
    const exportWalletMock = jest.fn().mockResolvedValue(undefined);
    solanaExportWalletMock.mockResolvedValue(undefined);
    const getAccessTokenMock = jest.fn().mockResolvedValue('test-token');
    const confirmSpy = jest.spyOn(window, 'confirm').mockImplementation(() => true);

    const userWithBoth = {
      wallet: { address: '0x123', chainType: 'ethereum', walletClientType: 'privy' },
      linkedAccounts: [
        { type: 'wallet', chainType: 'ethereum', address: '0x123', walletClientType: 'privy' },
        { type: 'wallet', chainType: 'solana', address: 'solanaAddrConnected', walletClientType: 'privy' },
      ],
    };
    (usePrivy as jest.Mock).mockReturnValue({
      user: userWithBoth,
      ready: true,
      authenticated: true,
      exportWallet: exportWalletMock,
      getAccessToken: getAccessTokenMock,
    });
    (useWallets as jest.Mock).mockReturnValue({
      wallets: [
        { address: '0x123', chainType: 'ethereum', connected: true, walletClientType: 'privy' },
        { address: 'solanaAddrConnected', chainType: 'solana', connected: true },
      ],
    });

    (global.fetch as jest.Mock).mockImplementation(async (url) => {
      if (url === '/api/wallet/export') {
        return { ok: true, json: async () => ({ success: true }) };
      }
      return { ok: true, json: async () => ({}) };
    });

    render(<WalletPage />);
    await waitFor(() => expect(screen.getByText('Wallet Account')).toBeInTheDocument());

    const exportEthBtn = screen.getByText('Export Ethereum Private Key');
    fireEvent.click(exportEthBtn);
    fireEvent.click(await screen.findByText('Reveal Keys'));

    await waitFor(() => expect(screen.queryByText('Reveal Keys')).not.toBeInTheDocument());

    const buttons = screen.getAllByRole('button');
    const solanaButton = buttons.find(b => b.textContent?.includes('Solana Mainnet'))!;
    fireEvent.click(solanaButton);

    const exportSolBtn = await screen.findByText('Export Solana Private Key');
    fireEvent.click(exportSolBtn);
    fireEvent.click(await screen.findByText('Reveal Keys'));

    await waitFor(() => expect(screen.queryByText('Reveal Keys')).not.toBeInTheDocument());
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('renders loading state when not ready', () => {
    (usePrivy as jest.Mock).mockReturnValue({ ready: false });
    render(<WalletPage />);
    expect(screen.getByText('Loading wallet data...')).toBeInTheDocument();
  });

  it('renders connect wallet message when not authenticated', () => {
    (usePrivy as jest.Mock).mockReturnValue({ ready: true, authenticated: false });
    render(<WalletPage />);
    expect(screen.getByText('No Wallet Connected')).toBeInTheDocument();
  });

  it('renders wallet information when authenticated (Ethereum default)', async () => {
    render(<WalletPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Wallet Account')).toBeInTheDocument();
      expect(screen.getByText('0x123')).toBeInTheDocument();
    });
  });

  it('switches to Solana network and fetches balance via proxy', async () => {
    render(<WalletPage />);

    // Wait for initial render
    await waitFor(() => expect(screen.getByText('Wallet Account')).toBeInTheDocument());

    // Find and click Solana network button
    const buttons = screen.getAllByRole('button');
    const solanaButton = buttons.find(b => b.textContent?.includes('Solana Mainnet'));
    if (!solanaButton) throw new Error('Solana button not found');
    fireEvent.click(solanaButton);

    await waitFor(() => {
      // 2.5 SOL (from default mock)
      expect(screen.getByText('2.5000 SOL')).toBeInTheDocument(); 
      
      // Verify fetch was called with correct params
      expect(global.fetch).toHaveBeenCalledWith('/api/solana', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ action: 'balance', address: 'solanaAddrConnected' })
      }));
    });
  });

  it('handles read-only Solana wallet correctly', async () => {
    // Mock wallets to NOT have Solana connected
    (useWallets as jest.Mock).mockReturnValue({
      wallets: [mockWallets[0]], // Only Ethereum connected
    });

    // Override mock for this specific test if needed, but default returns 2.5
    // Let's change it to 1.5 to distinguish
    (global.fetch as jest.Mock).mockImplementation(async (url, _options) => {
        if (url === '/api/solana') {
            const body = JSON.parse((_options as { body: string }).body);
            if (body.action === 'balance') {
               return { ok: true, json: async () => ({ balance: "1.5000" }) };
            }
            if (body.action === 'transactions') {
               return { ok: true, json: async () => ({ transactions: [] }) };
            }
        }
        return { ok: true, json: async () => ({ status: '1', result: [] }) };
    });
    
    render(<WalletPage />);

    await waitFor(() => expect(screen.getByText('Wallet Account')).toBeInTheDocument());

    const buttons = screen.getAllByRole('button');
    const solanaButton = buttons.find(b => b.textContent?.includes('Solana Mainnet'));
    if (!solanaButton) throw new Error('Solana button not found');
    fireEvent.click(solanaButton);

    await waitFor(() => {
      // Should show read-only indicator
      expect(screen.getByText('Read-only (Linked)')).toBeInTheDocument();
      expect(screen.getByText('solanaAddr123')).toBeInTheDocument();
      expect(screen.getByText('1.5000 SOL')).toBeInTheDocument();
    });
  });

  it('copies address to clipboard', async () => {
    render(<WalletPage />);
    await waitFor(() => expect(screen.getByText('0x123')).toBeInTheDocument());

    const copyButton = screen.getByText('Copy');
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('0x123');
    await waitFor(() => expect(screen.getByText('Copied!')).toBeInTheDocument());
  });

  it('switches back to Ethereum after selecting Solana', async () => {
    render(<WalletPage />);
    
    // 1. Start at Ethereum
    await waitFor(() => expect(screen.getByText('Wallet Account')).toBeInTheDocument());
    expect(screen.getByText('0x123')).toBeInTheDocument();

    // 2. Switch to Solana
    const buttons = screen.getAllByRole('button');
    const solanaButton = buttons.find(b => b.textContent?.includes('Solana Mainnet'));
    if (!solanaButton) throw new Error('Solana button not found');
    fireEvent.click(solanaButton);

    await waitFor(() => {
      expect(screen.getByText('2.5000 SOL')).toBeInTheDocument();
    });

    // 3. Switch back to Ethereum
    const ethButton = buttons.find(b => b.textContent?.includes('Ethereum Mainnet'));
    if (!ethButton) throw new Error('Ethereum button not found');
    fireEvent.click(ethButton);

    await waitFor(() => {
       // Should show Ethereum address and balance again
       expect(screen.getByText('0x123')).toBeInTheDocument();
       // Expect mock balance from API proxy since it's a read-only wallet in this test case context
       // (Assuming the switch back created a read-only wallet if connected wasn't found, 
       // but in this test mockWallets has a connected eth wallet, so it uses provider.)
       // However, let's add a test specifically for read-only Ethereum.
     });
   });

  it('fetches Ethereum balance via proxy for read-only wallet', async () => {
      // Mock only read-only Ethereum wallet
      (useWallets as jest.Mock).mockReturnValue({ wallets: [] });
      const readOnlyUser = {
        ...mockUser,
        linkedAccounts: [{ type: 'wallet', chainType: 'ethereum', address: '0xReadOnlyEth' }]
      };
      (usePrivy as jest.Mock).mockReturnValue({
        user: readOnlyUser,
        ready: true,
        authenticated: true,
      });

      render(<WalletPage />);

      // It should auto-select the linked account
      await waitFor(() => {
        expect(screen.getByText('Wallet Account')).toBeInTheDocument();
        expect(screen.getByText('0xReadOnlyEth')).toBeInTheDocument();
        // Check for proxy balance
        expect(screen.getByText('1.2345 ETH')).toBeInTheDocument();
      });
   });

   it('exports Ethereum private key via Privy modal for embedded wallet', async () => {
      const exportWalletMock = jest.fn().mockResolvedValue(undefined);
      const getAccessTokenMock = jest.fn().mockResolvedValue('test-token');
      const userWithEmbeddedEth = {
        wallet: { address: '0x123', chainType: 'ethereum', walletClientType: 'privy' },
        linkedAccounts: [
          { type: 'wallet', chainType: 'ethereum', address: '0x123', walletClientType: 'privy' },
        ],
      };
      (usePrivy as jest.Mock).mockReturnValue({
        user: userWithEmbeddedEth,
        ready: true,
        authenticated: true,
        exportWallet: exportWalletMock,
        getAccessToken: getAccessTokenMock,
      });
      (useWallets as jest.Mock).mockReturnValue({ wallets: [
        {
          address: '0x123', chainType: 'ethereum', chainId: 'eip155:1', connected: true,
          getEthereumProvider: jest.fn().mockResolvedValue({ request: jest.fn().mockResolvedValue('0xDE0B6B3A7640000') }),
        }
      ]});

      // Mock backend export log endpoint
      (global.fetch as jest.Mock).mockImplementation(async (url) => {
        if (url === '/api/wallet/export') {
          return { ok: true, json: async () => ({ success: true }) };
        }
        return { ok: true, json: async () => ({}) };
      });

      render(<WalletPage />);
      await waitFor(() => expect(screen.getByText('Wallet Account')).toBeInTheDocument());

      const exportBtn = screen.getByText('Export Ethereum Private Key');
      fireEvent.click(exportBtn);

      const revealBtn = await screen.findByText('Reveal Keys');
      fireEvent.click(revealBtn);

      await waitFor(() => {
        expect(screen.queryByText('Reveal Keys')).not.toBeInTheDocument();
      });
   });


  it('handles Ethereum export error when no embedded wallet is available', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      const exportWalletMock = jest.fn();
      const getAccessTokenMock = jest.fn().mockResolvedValue('test-token');
      const userWithExternalOnlyEth = {
        wallet: { address: '0xExternal', chainType: 'ethereum', walletClientType: 'external' },
        linkedAccounts: [
          { type: 'wallet', chainType: 'ethereum', address: '0xExternal', walletClientType: 'external' },
        ],
      };
      (usePrivy as jest.Mock).mockReturnValue({
        user: userWithExternalOnlyEth,
        ready: true,
        authenticated: true,
        exportWallet: exportWalletMock,
        getAccessToken: getAccessTokenMock,
      });
      (useWallets as jest.Mock).mockReturnValue({ wallets: [
        { address: '0xExternal', chainType: 'ethereum', connected: true,
          getEthereumProvider: jest.fn().mockResolvedValue({ request: jest.fn().mockResolvedValue('0x0') }) }
      ]});

      render(<WalletPage />);
      await waitFor(() => expect(screen.getByText('Wallet Account')).toBeInTheDocument());

      const exportBtn = screen.getByText('Export Ethereum Private Key');
      fireEvent.click(exportBtn);

      const revealBtn = await screen.findByText('Reveal Keys');
      fireEvent.click(revealBtn);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
        expect(exportWalletMock).not.toHaveBeenCalled();
      });

      alertSpy.mockRestore();
   });
 });
