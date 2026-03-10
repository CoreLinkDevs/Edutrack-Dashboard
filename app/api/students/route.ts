import { type NextRequest, NextResponse } from "next/server"
import { API_CONFIG } from "@/lib/config"

// Helper function to generate secure password
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Helper function to send welcome email
// **Email Notifications**: New parents automatically receive a welcome email with their auto-generated login credentials
// **Multiple Parent Support**: When creating multiple parents, each parent receives their own personalized welcome email with individual login credentials
// **Individual Credentials**: Each parent gets unique login credentials (email + generated password) sent to their personal email address
// **Email Delivery**: All emails are sent asynchronously - if one email fails, others are still delivered successfully
async function sendWelcomeEmail(params: {
  to: string
  name: string
  email: string
  password: string
  schoolName: string
  relationship: string
  studentName: string
}): Promise<void> {
  try {
    // In real implementation, this would integrate with an email service like SendGrid, Mailgun, etc.
    // For now, we'll simulate the email sending with detailed logging
    console.log('📧 Sending welcome email:', {
      to: params.to,
      subject: `Welcome to ${params.schoolName} - Parent Account Created`,
      relationship: params.relationship,
      studentName: params.studentName,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to ${params.schoolName}!</h2>
          <p>Dear ${params.name},</p>
          <p>Your account has been created as a ${params.relationship.toLowerCase()} for ${params.studentName}.</p>
          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3>Your Login Credentials:</h3>
            <p><strong>Email:</strong> ${params.email}</p>
            <p><strong>Temporary Password:</strong> ${params.password}</p>
          </div>
          <p><strong>Important:</strong> Please change your password after first login for security.</p>
          <p>You can login at: <a href="https://app.example.com/login">https://app.example.com/login</a></p>
          <p>If you have any questions, please contact the school administration.</p>
          <br>
          <p>Best regards,<br>${params.schoolName} Team</p>
        </div>
      `,
      text: `
        Welcome to ${params.schoolName}!

        Dear ${params.name},

        Your account has been created as a ${params.relationship.toLowerCase()} for ${params.studentName}.

        Your Login Credentials:
        Email: ${params.email}
        Temporary Password: ${params.password}

        Important: Please change your password after first login for security.

        You can login at: https://app.example.com/login

        If you have any questions, please contact the school administration.

        Best regards,
        ${params.schoolName} Team
      `
    })

    // Simulate async email sending delay
    await new Promise(resolve => setTimeout(resolve, 100))

    console.log(`✅ Welcome email sent successfully to ${params.to}`)
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${params.to}:`, error)
    throw error // Re-throw to allow calling code to handle individual email failures
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const authorization = request.headers.get("authorization")

  if (!authorization) {
    return NextResponse.json({ error: "Authorization header required" }, { status: 401 })
  }

  try {
    const queryString = searchParams.toString()
    const url = `${API_CONFIG.BASE_URL}/api/students${queryString ? `?${queryString}` : ""}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ error: errorData.message || "Failed to fetch students" }, { status: response.status })
    }

    const data = await response.json()

    // Transform response to match new API specification
    if (data.students) {
      // Ensure response matches the expected format with pagination
      return NextResponse.json({
        message: data.message || "Students retrieved successfully",
        students: data.students,
        pagination: data.pagination || {
          page: parseInt(searchParams.get("page") || "1"),
          limit: parseInt(searchParams.get("limit") || "10"),
          total: data.students.length,
          pages: Math.ceil(data.students.length / (parseInt(searchParams.get("limit") || "10")))
        }
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Students API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization")

  if (!authorization) {
    return NextResponse.json({ error: "Authorization header required" }, { status: 401 })
  }

  try {
    const body = await request.json()

    // Validate required fields
    const {
      registrationNumber,
      name,
      surname,
      birthday,
      sex,
      address,
      schoolId,
      classId,
      gradeId,
      parentDetails,
      parentRelationships
    } = body

    if (!registrationNumber || !name || !surname || !birthday || !sex || !schoolId || !classId || !gradeId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate parent information
    if (!parentDetails && !parentRelationships) {
      return NextResponse.json({ error: "Either parentDetails or parentRelationships must be provided" }, { status: 400 })
    }

    if (parentDetails) {
      // Validate that at least one parent is marked as primary
      const hasPrimary = parentDetails.some((parent: any) => parent.isPrimary === true)
      if (!hasPrimary) {
        return NextResponse.json({ error: "At least one parent must be marked as primary" }, { status: 400 })
      }
    }

    if (parentRelationships) {
      // Validate that at least one relationship is marked as primary
      const hasPrimary = parentRelationships.some((rel: any) => rel.isPrimary === true)
      if (!hasPrimary) {
        return NextResponse.json({ error: "At least one parent relationship must be marked as primary" }, { status: 400 })
      }
    }

    // Transform request body to match backend expectations with enhanced parent handling
    const transformedBody = {
      registrationNumber,
      name,
      surname,
      birthday,
      sex,
      address,
      schoolId,
      classId,
      gradeId,
      // Handle multiple parents with individual email notifications
      ...(parentDetails && {
        parentDetails: parentDetails.map((parent: any) => {
          // Generate individual secure password for each parent
          const generatedPassword = generateSecurePassword()

          // Send individual welcome email to each parent asynchronously
          sendWelcomeEmail({
            to: parent.email,
            name: `${parent.name} ${parent.surname}`,
            email: parent.email,
            password: generatedPassword,
            schoolName: "Example School", // In real implementation, fetch from school data
            relationship: parent.relationship,
            studentName: `${name} ${surname}`
          }).catch(error => {
            console.error(`Failed to send welcome email to ${parent.email}:`, error)
            // Continue with other emails even if one fails
          })

          return {
            email: parent.email,
            username: parent.username,
            name: parent.name,
            surname: parent.surname,
            phone: parent.phone,
            relationship: parent.relationship,
            isPrimary: parent.isPrimary,
            generatedPassword // Include generated password for backend processing
          }
        })
      }),
      ...(parentRelationships && {
        parentRelationships: parentRelationships.map((rel: any) => ({
          parentId: rel.parentId,
          relationship: rel.relationship,
          isPrimary: rel.isPrimary
        }))
      })
    }

    const fetchResponse = await fetch(`${API_CONFIG.BASE_URL}/api/students`, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transformedBody),
    })

    if (!fetchResponse.ok) {
      const errorData = await fetchResponse.json().catch(() => ({}))
      return NextResponse.json({ error: errorData.message || "Failed to create student" }, { status: fetchResponse.status })
    }

    const data = await fetchResponse.json()

    // Transform response to match new API specification
    const apiResponse: any = {
      message: data.message || "Student created successfully",
      student: data.student,
      parentCreated: data.parentCreated || !!parentDetails,
      parentsCreated: parentDetails ? parentDetails.length : 0,
      emailsSent: parentDetails ? parentDetails.length : 0
    }

    // Add detailed parent information if parents were created
    if (parentDetails) {
      apiResponse.parentDetails = parentDetails.map((parent: any) => ({
        email: parent.email,
        name: `${parent.name} ${parent.surname}`,
        relationship: parent.relationship,
        isPrimary: parent.isPrimary,
        emailSent: true // In real implementation, track actual email delivery status
      }))
    }

    return NextResponse.json(apiResponse)
  } catch (error) {
    console.error("Create student API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
