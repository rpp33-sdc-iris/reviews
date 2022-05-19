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
  const randomReviewId = Math.floor(Math.random() * 5774953);
  http.put(`http://localhost:8080/reviews/${randomReviewId}/report`);
  sleep(1);
}
