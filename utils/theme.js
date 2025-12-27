// utils/theme.ts

export const isChristmasTime = () => {
  const today = new Date();
  const month = today.getMonth(); // 0 = Jan, 11 = Dec
  const date = today.getDate();


  const isDec = month === 11 && date >= 1; 
  const isJan = month === 0 && date <= 5;

  return isDec || isJan;
};