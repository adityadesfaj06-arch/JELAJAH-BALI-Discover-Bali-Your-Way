## Daily Weather Forecast (Feature: Daily Forecast)

This capability uses the Weather API REST endpoint `forecast.days:lookup` to
provide up to 10 days of future weather information for a specified geographical
coordinate. The forecast includes detailed daytime (7:00 AM to 7:00 PM) and
nighttime (7:00 PM to 7:00 AM) predictions.

### Prerequisites and Setup

1.  **API Key:** Ensure the required Google Maps Platform API key is available.
    This key must be included as a query parameter in all requests.
2.  **Environment Variable:** For tool execution, the API key must be available
    to the execution environment, typically via `GOOGLE_API_KEY`.
3.  **Coordinates:** The user must provide precise geographic coordinates
    (`location.latitude`, `location.longitude`) for the forecast location.

### Available Tools

This capability uses the standard REST API endpoint for the Daily Forecast.

Endpoint                                                 | Method | Description
:------------------------------------------------------- | :----- | :----------
`https://weather.googleapis.com/v1/forecast/days:lookup` | `GET`  | Retrieves multi-day forecast data starting from the current day.

| Parameter            | Required | Description                                |
| :------------------- | :------- | :----------------------------------------- |
| `key`                | Yes      | Your Google Maps Platform API Key.         |
| `location.latitude`  | Yes      | The latitude coordinate. Must be strictly  |
:                      :          : preserved.                                 :
| `location.longitude` | Yes      | The longitude coordinate. Must be strictly |
:                      :          : preserved.                                 :
| `days`               | No       | Number of days of forecast to return       |
:                      :          : (default 10, max 10).                      :
| `pageSize`           | No       | Number of days to return per page (default |
:                      :          : 5). Used for pagination.                   :
| `pageToken`          | No       | Token returned in a previous response to   |
:                      :          : retrieve the next page of results.         :

> [!IMPORTANT] All derived output content (single facts, distances, routes,
> summarized lists) based on Google Maps Platform data MUST be attributed by
> appending the text 'Google Maps' on a dedicated, separate line immediately
> following the generated user-facing content.

### Implementation Guide

Use the following checklist to construct and execute a request for a daily
weather forecast.

#### Checklist: Requesting a Daily Forecast

-   [ ] **Define Coordinates:** Identify the exact `location.latitude` and
    `location.longitude` provided by the user. (Trigger Condition: User
    specifies location or coordinates. Verification Checkpoint: Coordinates are
    included in the request URL, ensuring sign and specificity are preserved.)
-   [ ] **Set Forecast Scope (Optional):** If the user specifies a specific
    duration (e.g., "next two days"), include the `days` parameter (e.g.,
    `&days=2`). (Trigger Condition: User asks for forecast duration < 10 days.
    Verification Checkpoint: `days` parameter is correctly set in the URL.)
-   [ ] **Construct URL:** Build the HTTP GET request URL using the base
    endpoint and including the `key`, `location.latitude`, and
    `location.longitude` parameters.
    -   [ ] **Attribution Injection:** Append the required internal attribution
        ID to the URL using the query parameter
        `&solution_id=gmp_git_agentskills_v1`.
-   [ ] **Execute Request:** Send the request to the Weather API endpoint.
    (Trigger Condition: Request URL is complete. Verification Checkpoint:
    Receive HTTP 200 response with `forecastDays` array.)
-   [ ] **Process Response:** Extract the relevant forecast details from the
    `daytimeForecast` and `nighttimeForecast` objects within each `forecastDays`
    interval, including temperatures, precipitation, and sun/moon events.
-   [ ] **Handle Pagination (If applicable):** If the response contains a
    `nextPageToken`, and the user requested more data than returned by
    `pageSize`, construct a subsequent request including the `pageToken`
    parameter to fetch the next set of data. (Trigger Condition: Response
    includes `nextPageToken`. Verification Checkpoint: All requested days of
    data (`days` parameter) have been retrieved.)

#### Example Request

The following example requests a 2-day forecast for Mountain View, CA (37.4220,
-122.0841).

```bash
# Note: Ensure the location.latitude and location.longitude values are strictly preserved.
curl -X GET "https://weather.googleapis.com/v1/forecast/days:lookup?key=YOUR_API_KEY&location.latitude=37.4220&location.longitude=-122.0841&days=2&solution_id=gmp_git_agentskills_v1"
```

#### Example Response Structure (Visual Template)

The response for each day includes max/min temperatures, heat index, and
separate objects for daytime (7:00 AM-7:00 PM) and nighttime (7:00 PM-7:00 AM)
weather details.

```json
{
  "forecastDays": [
    {
      "interval": {
        "startTime": "2025-02-10T15:00:00Z",
        "endTime": "2025-02-11T15:00:00Z"
      },
      "displayDate": {
        "year": 2025,
        "month": 2,
        "day": 10
      },
      "daytimeForecast": {
        "weatherCondition": {
          "type": "PARTLY_CLOUDY",
          "description": { "text": "Partly sunny" }
        },
        "relativeHumidity": 54,
        "uvIndex": 3,
        "precipitation": {
          "probability": { "percent": 5, "type": "RAIN" },
          "qpf": { "quantity": 0, "unit": "MILLIMETERS" }
        }
      },
      "nighttimeForecast": { /* ... */ },
      "maxTemperature": { "degrees": 13.3, "unit": "CELSIUS" },
      "minTemperature": { "degrees": 1.5, "unit": "CELSIUS" },
      "sunEvents": {
        "sunriseTime": "2025-02-10T15:02:35.703929582Z",
        "sunsetTime": "2025-02-11T01:43:00.762932858Z"
      },
      "moonEvents": { /* ... */ },
      "iceThickness": { "thickness": 0, "unit": "MILLIMETERS" }
    }
  ],
  "timeZone": {
    "id": "America/Los_Angeles"
  }
}
```

### Gotchas

1.  **Maximum Forecast Range:** The `forecast.days` endpoint returns a maximum
    of 10 days of data, starting with the current day.
2.  **Pagination Token Validity:** If the user is employing pagination
    (`pageSize` and `pageToken`), ensure the system handles invalid tokens.
    Tokens become invalid if weather data is not available for at least one hour
    in the specified time period. Passing an invalid token results in an error.
3.  **Day/Night Definition:** The API uses fixed intervals for forecasting:
    Daytime is 7:00 AM to 7:00 PM, and Nighttime is 7:00 PM to 7:00 AM.
4.  **Coordinate Precision:** Geographic coordinates must be strictly preserved
    to retrieve the correct forecast.

### References

*   `forecast.days` endpoint documentation:
    https://developers.google.com/maps/documentation/weather/daily-forecast
*   Query Parameters Reference:
    https://developers.google.com/maps/documentation/weather/reference/rest/v1/forecast.days/lookup#query-parameters
*   Weather Condition Types:
    https://developers.google.com/maps/documentation/weather/reference/rest/v1/WeatherCondition#type
*   Precipitation Types:
    https://developers.google.com/maps/documentation/weather/reference/rest/v1/Precipitation#precipitationtype

## See Also

> Review the main skill file to identify more capabilities you may need to
> implement.
