import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

const BASE = 'https://fakestoreapi.com';

const tests = [

    //Soal 1.1
  { name: 'List Products - Success',    method: 'GET',      url: '/products',        expect: 200 },
  { name: 'List Products - Failed',     method: 'GET',      url: '/productss',       expect: 404 },
  { name: 'List Products - Updated',    method: 'PUT',      url: '/products',        expect: 405 }, 
  { name: 'List Products - Created',    method: 'POST',     url: '/products',        expect: 405 }, 
  { name: 'List Products - Deleted',    method: 'DELETE',   url: '/products',        expect: 405 },

  //Soal 1.2
  { name: 'Sort - Invalid Value',       method: 'GET',      url: '/products?sort=ascending',    expect: 400 },
  { name: 'Sort - Empty Value',         method: 'GET',      url: '/products?sort=',             expect: 400 },
  { name: 'Category - Invalid Value',   method: 'GET',      url: '/products?category=abcde',    expect: 400 },
  { name: 'Category - Empty Value',     method: 'GET',      url: '/products?category=',         expect: 400 },
  { name: 'Page - Limit Minus',         method: 'GET',      url: '/products?page=1&limit=-5',   expect: 400 },
  { name: 'Page - Limit Nol',           method: 'GET',      url: '/products?page=1&limit=0',    expect: 400 },
  { name: 'Page - Limit Non Numeric',   method: 'GET',      url: '/products?page=1&limit=abc',  expect: 400 },
];

// Load Testing 
export const options = {
    stages: [
        { duration: '5',  target: 1  }, //API Test
        { duration: '10', target: 10 }, //Load Test
        { duration: '5',  target: 50 }, //Stress Test 1
        { duration: '5',  target: 100 }, //Stress Test 2
        { duration: '5',  target: 0 },  //Stress Test 3
    ]
};

export default function () {

    // API Test
  group("API Testing - Validate Status Code", () => {

    tests.forEach(t => {
      group(t.name, () => {

        const res = http.request(t.method, BASE + t.url);

        check(res, {
          "Response time < 1000ms": (r) => r.timings.duration < 1000,
          [`Status code ${t.expect}`]: (r) => r.status === t.expect,
        });

      });
    });

  });


  // Load Test
  group("Load Testing (10 VU)", () => {

    const res = http.get(BASE + "/products");

    check(res, {
      "200 OK": (r) => r.status === 200,
      "Fast (<800ms)": (r) => r.timings.duration < 800,
    });

  });

  //Stress Test 
  group("Stress Testing (50 → 100 VU)", () => {

    const res = http.get(BASE + "/products");

    check(res, {
      "Status 200": (r) => r.status === 200,
    });

  });

  sleep(1); // Jeda
}

// Reporting
export function handleSummary(data) {
  return {
    "fakestore-report.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true })
  };
}
