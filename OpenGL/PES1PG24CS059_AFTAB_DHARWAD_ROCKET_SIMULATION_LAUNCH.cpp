// Rocket Launch Simulation - Aftab Dharwad
// Features: Countdown, Smoke, Flames, Camera Control (WASD), Night/Day Toggle, Launch Pad, Clouds, Stars, 3D Rocket

#define _CRT_SECURE_NO_WARNINGS
#include <windows.h>
#include <GL/glut.h>
#include <cmath>
#include <cstdlib>
#include <cstring>
#include <cstdio>

// ---------- Global Variables ----------
float rocketY = -1.0f;
bool launch = false;
int countdown = 3;
bool countingDown = false;
bool cameraTopView = false;
bool smokeEnabled = false;
bool nightMode = false;
float zoomZ = 5.0f;         // Camera zoom level
float cameraX = 0.0f;       // Side panning
float cloudOffset = 0.0f;   // Cloud drift animation

// ---------- Utility Function to Render Bitmap Text ----------
void renderBitmapString(float x, float y, void* font, const char* string) {
    glRasterPos2f(x, y);
    for (const char* c = string; *c != '\0'; c++) {
        glutBitmapCharacter(font, *c);
    }
}

// ---------- OpenGL Initialization ----------
void initRendering() {
    glEnable(GL_DEPTH_TEST);
    glEnable(GL_LIGHTING);
    glEnable(GL_LIGHT0); glEnable(GL_LIGHT1); glEnable(GL_LIGHT2);
    glEnable(GL_COLOR_MATERIAL);
    glEnable(GL_NORMALIZE);
    glEnable(GL_BLEND);
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
    glShadeModel(GL_SMOOTH);
    glClearColor(0.2f, 0.4f, 0.8f, 1.0f); // Daytime sky blue
}

// ---------- Window Resize ----------
void handleResize(int w, int h) {
    glViewport(0, 0, w, h);
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    gluPerspective(45.0, (double)w / h, 1.0, 200.0);
}

// ---------- Light Setup ----------
void setupLights() {
    GLfloat lightPos[] = { 5.0f, 5.0f, 5.0f, 1.0f };
    GLfloat lightCol[] = { 1.0f, 1.0f, 0.9f, 1.0f };
    glLightfv(GL_LIGHT0, GL_POSITION, lightPos);
    glLightfv(GL_LIGHT0, GL_DIFFUSE, lightCol);
}

// ---------- Material Properties ----------
void applyMaterial() {
    GLfloat ambient[] = { 0.2f, 0.2f, 0.2f, 1.0f };
    GLfloat diffuse[] = { 0.6f, 0.6f, 0.6f, 1.0f };
    GLfloat specular[] = { 1.0f, 1.0f, 1.0f, 1.0f };
    GLfloat shininess[] = { 50.0f };
    glMaterialfv(GL_FRONT, GL_AMBIENT, ambient);
    glMaterialfv(GL_FRONT, GL_DIFFUSE, diffuse);
    glMaterialfv(GL_FRONT, GL_SPECULAR, specular);
    glMaterialfv(GL_FRONT, GL_SHININESS, shininess);
}

// ---------- Draw Ground ----------
void drawGround() {
    glColor3f(0.1f, 0.6f, 0.1f); // Green
    glBegin(GL_QUADS);
    glVertex3f(-10, -1, -10); glVertex3f(10, -1, -10);
    glVertex3f(10, -1, 10);   glVertex3f(-10, -1, 10);
    glEnd();
}

// ---------- Celestial Body (Sun/Moon) ----------
void drawCelestialBody() {
    glPushMatrix();
    glTranslatef(3.0f, 3.0f, -5.0f);
    glColor3f(nightMode ? 1.0f : 1.0f, nightMode ? 1.0f : 1.0f, nightMode ? 1.0f : 0.0f);
    glutSolidSphere(0.3, 20, 20);
    glPopMatrix();
}

// ---------- Draw Launch Pad ----------
void drawPad() {
    glColor3f(0.4f, 0.3f, 0.2f); // Brown pad
    applyMaterial();

    // Base platform
    glPushMatrix();
    glTranslatef(0.0f, -1.0f, 0.0f);
    glScalef(1.5f, 0.2f, 1.5f);
    glutSolidCube(1.0f);
    glPopMatrix();

    // Support pillar
    glPushMatrix();
    glTranslatef(0.0f, -0.75f, 0.0f);
    glScalef(0.1f, 0.5f, 0.1f);
    glutSolidCube(1.0f);
    glPopMatrix();
}

// ---------- Draw Rocket ----------
void drawRocket() {
    glPushMatrix();
    glTranslatef(0.0f, rocketY, 0.0f);
    applyMaterial();
    GLUquadric* quad = gluNewQuadric();

    // Rocket body
    glColor3f(0.8f, 0.8f, 0.8f);
    glPushMatrix();
    glRotatef(-90, 1, 0, 0);
    gluCylinder(quad, 0.2f, 0.2f, 1.0f, 32, 32);
    glPopMatrix();

    // Rocket nose
    glColor3f(1.0f, 0.0f, 0.0f);
    glPushMatrix();
    glTranslatef(0.0f, 1.0f, 0.0f);
    glRotatef(-90, 1, 0, 0);
    glutSolidCone(0.2f, 0.3f, 32, 32);
    glPopMatrix();

    // Fins (triangles)
    glColor3f(0.0f, 0.0f, 1.0f);
    glBegin(GL_TRIANGLES);
    glVertex3f(-0.2f, 0.0f, 0.0f); glVertex3f(-0.4f, -0.3f, 0.2f); glVertex3f(-0.2f, 0.1f, 0.0f);
    glVertex3f(0.2f, 0.0f, 0.0f);  glVertex3f(0.4f, -0.3f, 0.2f);  glVertex3f(0.2f, 0.1f, 0.0f);
    glVertex3f(0.0f, 0.0f, -0.2f); glVertex3f(0.0f, -0.3f, -0.4f); glVertex3f(0.1f, 0.1f, -0.2f);
    glEnd();

    gluDeleteQuadric(quad);
    glPopMatrix();
}

// ---------- Draw Smoke ----------
void drawSmoke() {
    if (launch && smokeEnabled) {
        glPushMatrix();
        glTranslatef(0.0f, rocketY - 0.3f, 0.0f);
        for (int i = 0; i < 20; ++i) {
            float x = ((rand() % 100) - 50) / 500.0f;
            float y = ((rand() % 100)) / 500.0f;
            float z = ((rand() % 100) - 50) / 500.0f;
            float size = 0.1f + (rand() % 100) / 1000.0f;
            glColor4f(0.6f, 0.6f, 0.6f, 0.5f);
            glPushMatrix();
            glTranslatef(x, -y, z);
            glutSolidSphere(size, 10, 10);
            glPopMatrix();
        }
        glPopMatrix();
    }
}

// ---------- Draw Flames ----------
void drawFlames() {
    if (!launch) return;
    glPushMatrix();
    glTranslatef(0.0f, rocketY, 0.0f);

    for (int i = 0; i < 3; ++i) {
        float flicker = 0.05f * (rand() % 10);
        float height = 0.2f + flicker;
        float baseRadius = 0.1f + (rand() % 10) / 100.0f;

        switch (i) {
        case 0: glColor3f(1.0f, 1.0f, 0.0f); break; // Yellow
        case 1: glColor3f(1.0f, 0.5f, 0.0f); break; // Orange
        case 2: glColor3f(1.0f, 0.0f, 0.0f); break; // Red
        }

        glPushMatrix();
        glTranslatef(0.0f, -0.1f - flicker * i, 0.0f);
        glRotatef(-90, 1.0f, 0.0f, 0.0f);
        glutSolidCone(baseRadius, height, 10, 2);
        glPopMatrix();
    }

    glPopMatrix();
}

// ---------- Draw Clouds ----------
void drawClouds() {
    glColor4f(1.0f, 1.0f, 1.0f, 0.65f);
    for (int i = -5; i <= 5; ++i) {
        float x = i * 2.5f + fmod(cloudOffset, 3.0f);
        float y = 2.8f, z = -4.0f;
        glPushMatrix();
        glTranslatef(x, y, z);
        glutSolidSphere(0.4, 20, 20);
        glTranslatef(-0.5f, 0.1f, 0.0f); glutSolidSphere(0.3, 20, 20);
        glTranslatef(1.0f, 0.0f, 0.0f); glutSolidSphere(0.3, 20, 20);
        glPopMatrix();
    }
}

// ---------- Draw Countdown ----------
void drawCountdown() {
    if (countingDown && countdown >= 0) {
        char buffer[10];
        sprintf(buffer, "%d", countdown);
        glColor3f(1, 1, 1);
        glRasterPos2f(-0.05f, 0.0f);
        renderBitmapString(0, 0, GLUT_BITMAP_TIMES_ROMAN_24, buffer);
    }
}

// ---------- Draw Stars in Night Mode ----------
void drawStars() {
    if (!nightMode) return;
    glPointSize(2.0);
    glBegin(GL_POINTS);
    glColor3f(1.0f, 1.0f, 1.0f);
    for (int i = 0; i < 100; ++i) {
        float x = (rand() % 200 - 100) / 10.0f;
        float y = (rand() % 100) / 10.0f + 1.0f;
        float z = (rand() % 200 - 100) / 10.0f;
        glVertex3f(x, y, z);
    }
    glEnd();
}

// ---------- Render All ----------
void drawScene() {
    glClearColor(nightMode ? 0.05f : 0.2f, nightMode ? 0.05f : 0.4f, nightMode ? 0.1f : 0.8f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    glMatrixMode(GL_MODELVIEW);
    glLoadIdentity();

    if (cameraTopView)
        gluLookAt(0.0, 8.0, 0.01, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0);
    else
        gluLookAt(cameraX, 1.0, zoomZ, cameraX, 0.0, 0.0, 0.0, 1.0, 0.0);

    setupLights();
    drawGround();
    drawClouds();
    drawCelestialBody();
    drawPad();
    drawRocket();
    drawSmoke();
    drawFlames();
    drawStars();
    drawCountdown();
    glutSwapBuffers();
}

// ---------- Scene Update Timer ----------
void update(int value) {
    cloudOffset += 0.001f;

    if (countingDown && countdown > 0) {
        countdown--;
        Sleep(1000); // 1 second pause
    }
    else if (countingDown && countdown == 0) {
        countingDown = false;
        launch = true;
    }
    else if (launch && rocketY < 3.0f) {
        rocketY += 0.005f;
    }

    glutPostRedisplay();
}

// ---------- Keyboard Input ----------
void handleKey(unsigned char key, int x, int y) {
    switch (key) {
    case 'l': if (!countingDown && !launch) { countingDown = true; countdown = 3; } break;
    case 'r': rocketY = -1.0f; launch = false; countingDown = false; countdown = 3; break;
    case 'c': cameraTopView = !cameraTopView; break;
    case 's': smokeEnabled = !smokeEnabled; break;
    case 't': nightMode = !nightMode; break;
    case '+':
    case 'w': zoomZ -= 0.3f; break;
    case '-':
    case 'x': zoomZ += 0.3f; break;
    case 'a': cameraX -= 0.3f; break;
    case 'd': cameraX += 0.3f; break;
    case 'q': exit(0); break;
    }
}

// ---------- Main Entry ----------
int main(int argc, char** argv) {
    glutInit(&argc, argv);
    glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB | GLUT_DEPTH);
    glutInitWindowSize(800, 600);
    glutCreateWindow("🚀 Rocket Launch Simulation - Aftab Dharwad");

    initRendering();
    glutDisplayFunc(drawScene);
    glutReshapeFunc(handleResize);
    glutKeyboardFunc(handleKey);
    glutIdleFunc([]() { update(0); });

    glutMainLoop();
    return 0;
}
