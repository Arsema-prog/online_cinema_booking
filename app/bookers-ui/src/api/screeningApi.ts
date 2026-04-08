import axios from "axios";
import { env } from "../env";

export const getScreenings = async () => {
    const res = await axios.get( `${env.apiGatewayUrl}/api/v1/core/screenings`);
    return res.data;
};