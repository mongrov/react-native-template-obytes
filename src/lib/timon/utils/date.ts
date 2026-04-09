/**
 * Date utilities for timon data transformations.
 * Uses dayjs for parsing/formatting; ensure dayjs is installed.
 */
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(customParseFormat);

export const FULL_DATE_24_HOUR_TIME_FORMAT = 'YYYY.MM.DD HH:mm:ss';

export const addNumberOfMinutes = (
  date: string,
  format: string,
  numberOfMinutes: number
) => {
  return dayjs(date, format).add(numberOfMinutes, 'minutes').format(format);
};

export const getTodaysDate = (format = 'YYYY.MM.DD') => {
  return dayjs().format(format);
};

export const getTodaysDateInUtc = (format = FULL_DATE_24_HOUR_TIME_FORMAT) => {
  return dayjs().utc().format(format);
};

export const getAllDateElementsInNumberFormat = () => {
  const now = dayjs().utc();
  return {
    year: now.year(),
    month: now.month() + 1,
    day: now.date(),
    hour: now.hour(),
    minute: now.minute(),
    second: now.second(),
  };
};
