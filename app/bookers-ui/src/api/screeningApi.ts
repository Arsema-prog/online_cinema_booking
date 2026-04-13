import apiClient from '../httpClient';

export const getScreenings = async () => {
    const res = await apiClient.get(`/api/v1/core/screenings`);
    return res.data;
};