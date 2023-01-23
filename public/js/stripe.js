import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51MT3bzCqe4MtsRp8aD6LT3SAG55M000oiVlS09WFo1220ysZIuX1gYOSz7Hx16TtM73I2y3bauOhiMOadCdCIgG800l4earpFZ'
);

export const bookTour = async (tourID) => {
  try {
    // 1) get checkout session from server
    const session = await axios(
      `http://localhost:3000/api/v1/bookings/checkout-session/${tourID}`
    );
    console.log(session);
    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert('error', err);
  }
};
