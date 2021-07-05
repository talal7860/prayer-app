class MyDate extends Date {
  prevDay(): MyDate {
    const date = new MyDate(this.getTime());
    date.setDate(date.getDate() - 1);
    return date;
  }

  beginningOfDay(): MyDate {
    const date = new MyDate(this);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  }
}

export default MyDate;
