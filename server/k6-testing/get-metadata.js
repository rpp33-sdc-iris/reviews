import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  scenarios: {
    constant_request_rate: {
      executor: 'constant-arrival-rate',
      rate: 240,
      timeUnit: '1s',
      duration: '60s',
      preAllocatedVUs: 240,
      maxVUs: 2400,
    },
  },
};

export default function () {
  const randomProductId = Math.floor(Math.random() * 1000011);
  http.get(`http://localhost:8080/reviews/meta?product_id=${randomProductId}`);
  sleep(1);
}
