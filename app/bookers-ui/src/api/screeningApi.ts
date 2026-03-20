import axios from "axios";
import { env } from "../env";

export const getScreenings = async () => {
    const res = await axios.get( `${env.coreServiceUrl}/screenings`);
    return res.data;
};