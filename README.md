Bangladesh Annual NDVI Dashboard (2015–2025)

This repository contains the source code for an interactive Google Earth Engine (GEE) web application designed to analyze and visualize annual mean Normalized Difference Vegetation Index (NDVI) for Bangladesh over the period 2015–2025.

The application provides country-scale and pixel-level insights into vegetation dynamics using harmonized Landsat NDVI composites, with interactive exploration, quality controls, and data export functionality.


🌍 Live Application

Public GEE App:
https://novomahmud.users.earthengine.app/view/bangladesh-annual-ndvi-dashboard-20152025

The app is publicly accessible and does not require authentication for viewing.


🎯 Objectives

Quantify and visualize annual mean NDVI at the national scale

Enable interactive spatial exploration of vegetation patterns

Support pixel-level inspection and temporal analysis

Provide data quality awareness through pixel availability metrics

Allow export of annual NDVI maps for further analysis

🛰️ Data Sources

NDVI Product:
Landsat Collection 2, Tier 1, 32-day NDVI composites
(LANDSAT/COMPOSITES/C02/T1_L2_32DAY_NDVI)

Administrative Boundaries:
FAO GAUL 2015, Level 0 (country boundaries)


🧮 Methodology

Annual Aggregation

NDVI images are grouped by calendar year (2015–2025).

For each year, the annual mean NDVI is computed.

Preprocessing Considerations

Cloud masking and invalid pixel handling are inherited from the NDVI composite product.

No additional cloud masking or sensor harmonization is applied.

Visualization

NDVI is displayed using a continuous brown-to-green palette representing low to high vegetation vigor.

Country boundaries are shown as black outlines without polygon fill.

Pixel-Level Analysis

Users can click on the map to inspect:

NDVI value

Vegetation class

Pixel data availability

Intra-annual NDVI time series


🧑‍💻 Application Features

Annual NDVI Map (2015–2025)

Year selector for interactive temporal exploration

NDVI time-series chart (country-wide annual means)

Click-to-inspect NDVI at pixel level

Vegetation class labeling:

Bare soil / Built-up

Sparse vegetation

Moderate vegetation

Dense vegetation

Pixel availability assessment at clicked locations

Export control:

Export disabled automatically when data availability is insufficient

GeoTIFF export of annual NDVI maps

Publication-quality UI and cartographic styling


📤 Data Export

Users can export the currently selected annual mean NDVI as a GeoTIFF:

Spatial resolution: 30 m

Projection: inherited from Landsat

Export region: Bangladesh

Export destination: Google Drive

Exports are enabled only when pixel data availability exceeds a predefined threshold to ensure data reliability.


🚀 How to Run the Code Locally (GEE)

Open the Google Earth Engine Code Editor
https://code.earthengine.google.com

Create a new script

Copy the contents of src/app.js into the editor

Click Run

To deploy or update the app:

Use Apps → Update

Select Current contents of editor

Publish


🔁 Updating the App

To modify the public app:

Edit the source script in the GEE Code Editor

Verify changes by running the script

Go to Apps → Update

Re-publish the app

The public URL remains unchanged after updates.


⚠️ Notes & Limitations

Annual NDVI values may be influenced by data gaps in persistently cloudy regions.

NDVI is a proxy for vegetation greenness and does not directly represent biomass or productivity.

The application is designed for exploratory analysis, not operational monitoring.


📖 Citation

If you use this app or code in academic work, please cite as:

Bangladesh Annual NDVI Dashboard (2015–2025), Google Earth Engine App.


📜 License

This project is licensed under the MIT License.
You are free to use, modify, and distribute the code with attribution.


👤 Author

Developed by Md. Mahmudul Hasan Novo
Google Earth Engine Application Developer
Remote Sensing & Geospatial Analysis
