import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/cart');
      setCart(data.cart);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      const { data } = await api.post('/cart', { productId, quantity });
      setCart(data.cart);
      toast.success('Item added to cart');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add item');
      return { success: false };
    }
  };

  const updateCartItem = async (productId, quantity) => {
    try {
      const { data } = await api.put('/cart', { productId, quantity });
      setCart(data.cart);
      toast.success('Cart updated');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update cart');
      return { success: false };
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const { data } = await api.delete(`/cart/${productId}`);
      setCart(data.cart);
      toast.success('Item removed from cart');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove item');
      return { success: false };
    }
  };

  const clearCart = async () => {
    try {
      const { data } = await api.delete('/cart');
      setCart(data.cart);
      toast.success('Cart cleared');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to clear cart');
      return { success: false };
    }
  };

  const getCartItemCount = () => {
    return cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  };

  const getCartTotal = () => {
    return cart?.totalPrice || 0;
  };

  const value = {
    cart,
    loading,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartItemCount,
    getCartTotal
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};