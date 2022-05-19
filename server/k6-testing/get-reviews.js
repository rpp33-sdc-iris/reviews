import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  scenarios: {
    constant_request_rate: {
      executor: 'constant-arrival-rate',
      rate: 230,
      timeUnit: '1s',
      duration: '60s',
      preAllocatedVUs: 230,
      maxVUs: 2300,
    },
  },
};

export default function () {
  const randomProductId = Math.floor(Math.random() * 1000011).toString();
  http.get(`http://localhost:8080/reviews?product_id=${randomProductId}&page=1&count=1000&sort=relevant`);
  sleep(1);
}
