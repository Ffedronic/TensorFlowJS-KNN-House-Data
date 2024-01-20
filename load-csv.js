const fs = require("fs");
const _ = require("lodash");
const shuffleSeed = require("shuffle-seed");

/**
 * The function extracts specific columns from a given dataset.
 * @param data - The `data` parameter is an array of arrays, where each inner array represents a row of
 * data. The first inner array is assumed to be the header row, containing the column names.
 * @param columnNames - An array of strings representing the names of the columns you want to extract
 * from the data.
 * @returns an array of arrays, where each inner array contains the values extracted from the specified
 * columns in the input data.
 */
function extractColumns(data, columnNames) {
  const headers = _.first(data);

  /* The line `const indexes = _.map(columnNames, column => headers.indexOf(column));` is creating an
array called `indexes` that contains the indexes of the specified `columnNames` in the `headers`
array. */
  const indexes = _.map(columnNames, (column) => headers.indexOf(column));
  /* The line `const extracted = _.map(data, row => _.pullAt(row, indexes));` is extracting specific
columns from the input `data` array. */
  const extracted = _.map(data, (row) => _.pullAt(row, indexes));

  return extracted;
}

module.exports = function loadCSV(
  filename,
  {
    dataColumns = [],
    labelColumns = [],
    converters = {},
    shuffle = false,
    splitTest = false,
  }
) {
  /* The line `let data = fs.readFileSync(filename, { encoding: 'utf-8' });` is reading the contents of a
file synchronously and storing it in the `data` variable. */
  let data = fs.readFileSync(filename, { encoding: "utf-8" });
  /* The line `data = _.map(data.split('\n'), d => d.split(','));` is splitting the `data` string into an
array of rows by splitting it at each newline character (`\n`). Then, it further splits each row
into an array of values by splitting it at each comma (`,`). This effectively converts the CSV data
into a 2-dimensional array, where each inner array represents a row of data and each element within
the inner array represents a value in that row. */
  data = _.map(data.split("\n"), (d) => d.split(","));
  /* The line `data = _.dropRightWhile(data, (val) => _.isEqual(val, [""]));` is removing any empty rows
from the end of the `data` array. */
  data = _.dropRightWhile(data, (val) => _.isEqual(val, [""]));
  /* The line `const headers = _.first(data);` is extracting the first element of the `data` array and
assigning it to the `headers` variable. In this code, the first element of the `data` array is
assumed to be the header row, containing the column names. By extracting the header row, the code
can later use the column names to identify and extract specific columns from the data. */
  const headers = _.first(data);

  /* The code `data = _.map(data, (row, index) => {...})` is iterating over each row in the `data`
  array and applying a transformation to each element in the row. It checks if there is a converter function
      specified for the current column header. And it converts each element value in the row 
       to a floating-point number. It does this by first removing any double quotes (`"`) from
     the `element` value using the `replace` method. Then, it uses the `parseFloat` function to
     parse the resulting string as a floating-point number. */
  data = _.map(data, (row, index) => {
    if (index === 0) {
      return row;
    }
    return _.map(row, (element, index) => {
      /* The code block `if (converters[headers[index]]) {...}` checks if there is a converter function
      specified for the current column header. */
      if (converters[headers[index]]) {
        const converted = converters[headers[index]](element);
        return _.isNaN(converted) ? element : converted;
      }

      /* The code `const result = parseFloat(element.replace('"', ""));` is converting the `element`
     value to a floating-point number. It does this by first removing any double quotes (`"`) from
     the `element` value using the `replace` method. Then, it uses the `parseFloat` function to
     parse the resulting string as a floating-point number. */
      const result = parseFloat(element.replace('"', ""));
      return _.isNaN(result) ? element : result;
    });
  });

/* The line `let labels = extractColumns(data, labelColumns);` is calling the `extractColumns` function
and passing in the `data` array and the `labelColumns` array as arguments to extract specific
columns data corresponding to labelColumns from the input `data` array. */
  let labels = extractColumns(data, labelColumns);
  data = extractColumns(data, dataColumns);
  /* The code `data.shift(); labels.shift();` is removing the first element from the `data` and
  `labels` arrays. */
  data.shift();
  labels.shift();

 /* The code block `if (shuffle) {...}` is checking if the `shuffle` parameter is truthy. If it is, it
 means that shuffling of the data is requested with seed. */
  if (shuffle) {
    data = shuffleSeed.shuffle(data, "phrase");
    labels = shuffleSeed.shuffle(labels, "phrase");
  }

 /* This code block is responsible for splitting the data into training and testing sets. */
  if (splitTest) {
    const trainSize = _.isNumber(splitTest)
      ? splitTest
      : Math.floor(data.length / 2);

    return {
      features: data.slice(trainSize),
      labels: labels.slice(trainSize),
      testFeatures: data.slice(0, trainSize),
      testLabels: labels.slice(0, trainSize),
    };
  } else {
    return { features: data, labels };
  }
};
