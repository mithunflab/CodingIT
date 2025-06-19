"use client";

import dynamic from 'next/dynamic';
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

const ApiDocsPage = () => {
  return (
    <div style={{ paddingTop: '20px' }}>
      <SwaggerUI url="/api/openapi-spec" />
    </div>
  );
};

export default ApiDocsPage;
