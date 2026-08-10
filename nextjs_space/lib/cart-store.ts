// Zustand cart store with localStorage persistence
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItemType {
  id: string;
  productId: string;
  name: string;
  nameEn: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartState {
  items: CartItemType[];
  addItem: (item: Omit<CartItemType, 'id'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item: Omit<CartItemType, 'id'>) => {
        set((state: CartState) => {
          const existing = state.items?.find((i: CartItemType) => i?.productId === item?.productId);
          if (existing) {
            return {
              items: (state.items ?? []).map((i: CartItemType) =>
                i?.productId === item?.productId
                  ? { ...(i ?? {}), quantity: (i?.quantity ?? 0) + (item?.quantity ?? 1) }
                  : i
              ),
            };
          }
          return {
            items: [...(state.items ?? []), { ...(item ?? {}), id: Date.now().toString() }],
          };
        });
      },
      removeItem: (productId: string) => {
        set((state: CartState) => ({
          items: (state.items ?? []).filter((i: CartItemType) => i?.productId !== productId),
        }));
      },
      updateQuantity: (productId: string, quantity: number) => {
        set((state: CartState) => ({
          items: (state.items ?? []).map((i: CartItemType) =>
            i?.productId === productId ? { ...(i ?? {}), quantity: Math.max(1, quantity) } : i
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        const state = get();
        return (state.items ?? []).reduce(
          (sum: number, i: CartItemType) => sum + (i?.price ?? 0) * (i?.quantity ?? 0),
          0
        );
      },
      getItemCount: () => {
        const state = get();
        return (state.items ?? []).reduce((sum: number, i: CartItemType) => sum + (i?.quantity ?? 0), 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
