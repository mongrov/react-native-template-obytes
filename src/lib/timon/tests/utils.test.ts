import dayjs from 'dayjs';
import {
  addNumberOfMinutes,
  getTodaysDate,
  getTodaysDateInUtc,
  getAllDateElementsInNumberFormat,
  FULL_DATE_24_HOUR_TIME_FORMAT,
} from '../utils/date';

describe('Timon Utils: Date', () => {
  describe('addNumberOfMinutes', () => {
    it('adds minutes correctly to a formatted date string', () => {
      const date = '2023.01.01 12:00:00';
      const result = addNumberOfMinutes(date, FULL_DATE_24_HOUR_TIME_FORMAT, 15);
      expect(result).toBe('2023.01.01 12:15:00');
    });

    it('handles negative minutes correctly', () => {
      const date = '2023.01.01 12:00:00';
      const result = addNumberOfMinutes(date, FULL_DATE_24_HOUR_TIME_FORMAT, -10);
      expect(result).toBe('2023.01.01 11:50:00');
    });

    it('handles hour/day wrap-around correctly', () => {
      const date = '2023.01.01 23:55:00';
      const result = addNumberOfMinutes(date, FULL_DATE_24_HOUR_TIME_FORMAT, 10);
      expect(result).toBe('2023.01.02 00:05:00');
    });
  });

  describe('getTodaysDate', () => {
    it('returns today date in default format', () => {
      const expected = dayjs().format('YYYY.MM.DD');
      expect(getTodaysDate()).toBe(expected);
    });

    it('returns today date in custom format', () => {
      const format = 'DD-MM-YYYY';
      const expected = dayjs().format(format);
      expect(getTodaysDate(format)).toBe(expected);
    });
  });

  describe('getTodaysDateInUtc', () => {
    it('returns UTC date in specified format', () => {
      const expected = dayjs().utc().format(FULL_DATE_24_HOUR_TIME_FORMAT);
      expect(getTodaysDateInUtc()).toBe(expected);
    });
  });

  describe('getAllDateElementsInNumberFormat', () => {
    it('returns correct numeric components for the current time', () => {
      const now = dayjs().utc();
      const result = getAllDateElementsInNumberFormat();
      
      expect(result).toEqual({
        year: now.year(),
        month: now.month() + 1,
        day: now.date(),
        hour: now.hour(),
        minute: now.minute(),
        second: now.second(),
      });
    });
  });
});
