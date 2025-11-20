export const formatMoney = (money: number) => {
  return money.toLocaleString("vi-VN", {
    style: "currency",
    currency: "USD",
  });
};

export const formatMoneyVND = (money: number) => {
  return money.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
};

export const formatNumber = (money: number) => {
  return money.toLocaleString("vi-VN");
};