import type { Options } from "swagger-jsdoc";

export class SwaggerConfig {
  // =====================================================
  // SWAGGER DOCUMENTATION OPTIONS
  // =====================================================

  static createOptions(baseUrl?: string): Options {
    return {
      definition: {
        openapi: "3.0.0",

        // =================================================
        // API INFORMATION
        // =================================================

        info: {
          title: "Payroll Backend API",
          version: "1.0.0",
          description:
            "Payroll backend API documentation for authentication, employees, payroll, payments, reports and application settings.",
          contact: {
            name: "Payroll Development Team",
          },
        },

        // =================================================
        // SERVER
        // =================================================

        servers: [
          {
            url:
              baseUrl ||
              "http://localhost:3000/api",
            description: "Local API Server",
          },
        ],

        // =================================================
        // TAGS
        // =================================================

        tags: [
          {
            name: "Health",
            description:
              "Health checks and database monitoring APIs",
          },

          {
            name: "Auth",
            description:
              "Authentication and user management APIs",
          },

          {
            name: "Employees",
            description:
              "Employee management APIs",
          },

          {
            name: "Payroll",
            description:
              "Payroll creation, processing and management APIs",
          },

          {
            name: "Payments",
            description:
              "Employee payment and transaction management APIs",
          },

          {
            name: "Reports",
            description:
              "Payroll, employee, department, tax and payment reports",
          },

          {
            name: "Settings",
            description:
              "Application, profile, company, payroll, notification, security and appearance settings",
          },
          {
            name: "Dashboard",
            description:
            "Dashboard statistics, charts and recent activity",
          },
        ],

        // =================================================
        // COMPONENTS
        // =================================================

        components: {
          // -------------------------------------------------
          // SECURITY
          // -------------------------------------------------

          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
              description:
                "Enter JWT token as: Bearer <token>",
            },
          },

          // -------------------------------------------------
          // COMMON RESPONSES
          // -------------------------------------------------

          responses: {
            Unauthorized: {
              description:
                "Unauthorized - Authentication token is missing or invalid",
            },

            BadRequest: {
              description:
                "Bad Request - Invalid request data",
            },

            NotFound: {
              description:
                "Resource not found",
            },

            InternalServerError: {
              description:
                "Internal Server Error",
            },
          },

          // -------------------------------------------------
          // COMMON SCHEMAS
          // -------------------------------------------------

          schemas: {
            ApiError: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                  example: false,
                },

                message: {
                  type: "string",
                  example:
                    "Something went wrong",
                },

                error: {
                  type: "string",
                  example:
                    "Internal Server Error",
                },
              },
            },

            ApiSuccess: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                  example: true,
                },

                message: {
                  type: "string",
                  example:
                    "Operation successful",
                },
              },
            },
          },
        },

        // =================================================
        // GLOBAL SECURITY
        // =================================================

        security: [
          {
            bearerAuth: [],
          },
        ],
      },

      // =====================================================
      // ROUTE DOCUMENTATION
      // =====================================================

      apis: [
        "./src/routes/**/*.ts",
        "./src/controllers/**/*.ts",
      ],
    };
  }

  // =====================================================
  // SWAGGER UI OPTIONS
  // =====================================================

  static createUIOptions() {
    return {
      customSiteTitle:
        "Payroll API Documentation",

      swaggerOptions: {
        // -------------------------------------------------
        // AUTHORIZATION
        // -------------------------------------------------

        persistAuthorization: true,

        // -------------------------------------------------
        // REQUEST INFORMATION
        // -------------------------------------------------

        displayRequestDuration: true,

        // -------------------------------------------------
        // SEARCH / FILTER
        // -------------------------------------------------

        filter: true,

        // -------------------------------------------------
        // TRY IT OUT
        // -------------------------------------------------

        tryItOutEnabled: true,

        // -------------------------------------------------
        // ENDPOINT EXPANSION
        // -------------------------------------------------

        docExpansion: "none",

        // -------------------------------------------------
        // API SERVER
        // -------------------------------------------------

        servers: [
          {
            url: "http://localhost:3000/api",
            description: "Local API Server",
          },
        ],
      },
    };
  }
}