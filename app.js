const fs = require("fs");
const csv = require("csv-parser");

const employees = [];
const employeesWith7ConsecutiveDays = new Set();
const employeesWithLongShifts = new Set();
const employeesWithShortBreaks = new Set();

const filename = "Assignment_timecard.csv";

fs.createReadStream(filename)
 .pipe(csv())
 .on("data", (row) => {
  employees.push(row);
 })
 .on("end", () => {
  // Grouping entries by pay cycle
  const employeeEntries = {};

  employees.forEach((employee) => {
   const key = `${employee["Employee Name"]}_${employee["Pay Cycle Start Date"]}_${employee["Pay Cycle End Date"]}`;

   if (!employeeEntries[key]) {
    employeeEntries[key] = [];
   }

   // Convert date strings to JavaScript Date objects
   employeeEntries[key].push({
    timeIn: new Date(employee.Time),
    timeOut: new Date(employee["Time Out"]),
    timecardHours: employee["Timecard Hours (as Time)"],
    positionId: employee["Position ID"],
   });
  });

  // Analyzing data to find employees for the respective criteria
  Object.keys(employeeEntries).forEach((key) => {
   const entries = employeeEntries[key];
   const employeeName = key.split("_")[0];

   // 1. Checking for employees who worked for 7 consecutive days
   let consecutiveDaysCount = 1;
   let hasConsecutiveDays = false;

   for (let i = 0; i < entries.length; ++i) {
    const currentDay = entries[i].timeIn.getDate();
    const nextDay =
     entries[i + 1 === entries.length ? i : i + 1].timeIn.getDate();

    // Check if the days are 7 or more consecutive
    if (nextDay - currentDay === 1 || nextDay - currentDay === 0) {
     if (nextDay - currentDay === 1) {
      consecutiveDaysCount++;
     } else if (consecutiveDaysCount >= 7) {
      hasConsecutiveDays = true; // return true if the counter turns 7
      break;
     }
    } else {
     consecutiveDaysCount = 1; // Reset count if days are not consecutive
    }
   }

   // adding the employee(along with the position id) to the set if 7 consecutive days are found
   if (hasConsecutiveDays) {
    employeesWith7ConsecutiveDays.add({
     employeeName,
     positionId: entries[0].positionId,
    });
   }

   // 2. Check for less than 10 hours of time between shifts but greater than 1 hour
   for (let i = 0; i < entries.length - 1; ++i) {
    const timeBetweenShifts = entries[i + 1].timeIn - entries[i].timeOut;

    // Convert milliseconds to hours
    const hoursBetweenShifts = timeBetweenShifts / (1000 * 60 * 60);

    // add the employee(along with the position id)to the set if the break is less than 10 hours and greater than 1 hour
    if (hoursBetweenShifts > 1 && hoursBetweenShifts < 10) {
     employeesWithShortBreaks.add({
      employeeName,
      positionId: entries[i].positionId,
     });
    }
   }

   // 3. Checking for shifts longer than 14 hours
   entries.forEach((entry) => {
    const [hours, minutes] = entry.timecardHours.split(":").map(Number);
    const date = new Date();

    // Set the date to today and set hours and minutes
    date.setHours(hours);
    date.setMinutes(minutes);

    // Get the total hours
    const shiftDuration = date.getHours() + date.getMinutes() / 60;

    // add the employee(along with the position id) to the set if the shift is longer than 14 hours
    if (shiftDuration > 14) {
     employeesWithLongShifts.add({
      employeeName,
      positionId: entry.positionId, 
     });
    }
   });
  });

  // Printing the results of each criteria
  // 1. Print the names of employees and the position Id who worked for 7 consecutive days
  console.log("Employees who worked for 7 consecutive days:");
  employeesWith7ConsecutiveDays.forEach((employee) => {
   console.log(`${employee.employeeName} (${employee.positionId})`);
  });

  // 2. Print the names of employees and the position id with short breaks between shifts
  console.log(
   "\nEmployees with short breaks between shifts (less than 10 hours but greater than 1 hour):"
  );
  employeesWithShortBreaks.forEach((employee) => {
   console.log(`${employee.employeeName} (${employee.positionId})`);
  });

  // 3. Print the names of employees and the position id with shifts more than 14 hours
  console.log(
   "\nEmployees who worked for more than 14 hours in a single shift:"
  );
  employeesWithLongShifts.forEach((employee) => {
   console.log(`${employee.employeeName} (${employee.positionId})`);
  });
 });
