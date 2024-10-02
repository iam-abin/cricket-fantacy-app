const httpResponseBody = (message = "success", data) => {
    const response = { success: true, message };
    if (data) response.data = data;
    return response;
};

export { httpResponseBody };
