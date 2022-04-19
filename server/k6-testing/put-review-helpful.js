import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 1000,
  duration: '30s',
};

export default function () {
  const randomReviewId = Math.floor(Math.random() * 5774953);
  http.put(`http://localhost:8080/reviews/${randomReviewId}/helpful`);
  sleep(1);
}
