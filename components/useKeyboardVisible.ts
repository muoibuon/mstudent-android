import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

/** true khi bàn phím ảo đang mở (để ẩn thanh tab nổi và bỏ khoảng trống dành cho nó). */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}
