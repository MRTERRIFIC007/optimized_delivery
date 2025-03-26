import requests
import json
import os
from datetime import datetime
import logging

class DeliveryChatbot:
    def __init__(self, predictor, perplexity_api_key=None):
        self.predictor = predictor
        self.perplexity_api_key = perplexity_api_key or os.environ.get("PERPLEXITY_API_KEY")
        if not self.perplexity_api_key:
            logging.warning("No Perplexity API key provided. Chatbot will use mock responses.")
        self.chat_history = []
        
    def process_query(self, query, current_context=None):
        """Process a natural language query from the postman"""
        # Build context from the current data
        system_context = self._build_system_context(current_context)
        
        if not self.perplexity_api_key:
            return self._generate_mock_response(query, system_context)
            
        # Prepare API request
        headers = {
            "Authorization": f"Bearer {self.perplexity_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "sonar",  # Using Perplexity's recommended model
            "messages": [
                {"role": "system", "content": system_context},
                *self.chat_history[-4:],  # Only include the last 4 exchanges to keep context manageable
                {"role": "user", "content": query}
            ],
            "temperature": 0.2,  # Lower temperature for more precise responses
            "max_tokens": 500,
            "top_p": 0.9,
            "frequency_penalty": 0.5,
            "return_related_questions": False  # Disable related questions to focus on direct answers
        }
        
        try:
            # Call Perplexity API
            response = requests.post(
                "https://api.perplexity.ai/chat/completions",
                headers=headers,
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                answer = result["choices"][0]["message"]["content"]
                
                # Update chat history
                self.chat_history.append({"role": "user", "content": query})
                self.chat_history.append({"role": "assistant", "content": answer})
                
                # Keep history to a reasonable size
                if len(self.chat_history) > 10:
                    self.chat_history = self.chat_history[-10:]
                    
                return answer
            else:
                error_msg = f"Error from Perplexity API: {response.status_code} - {response.text}"
                logging.error(error_msg)
                return f"I'm having trouble connecting to my knowledge base. Please try again later. Technical details: {response.status_code}"
                
        except Exception as e:
            logging.exception("Error processing chatbot query")
            return "I'm sorry, I encountered an error processing your request. Please try again."
    
    def _build_system_context(self, current_context=None):
        """Build system prompt with delivery data context"""
        system_prompt = """
        You are a helpful assistant for a delivery postman in Ahmedabad, India. Your name is DeliveryGPT.
        
        Your primary functions are:
        1. Provide information about pending deliveries and optimal delivery times
        2. Explain the current optimized route and why it's efficient
        3. Give details about customers and their preferences
        4. Suggest the best approach for each delivery based on historical data
        
        Today is {current_date}.
        
        CUSTOMER INFORMATION:
        {customer_info}
        
        TODAY'S PENDING DELIVERIES:
        {todays_deliveries}
        
        ROUTE INFORMATION (if available):
        {route_info}
        
        OPTIMAL DELIVERY TIMES:
        {optimal_times}
        
        When answering questions:
        - Be brief and focused on delivery-related information
        - Provide specific details when referring to addresses or delivery times
        - When suggesting optimal delivery times, explain why they are recommended
        - Format times using 24-hour format (e.g., 14:30 instead of 2:30 PM)
        - If asked about a specific customer, provide all relevant details we have
        - If you don't know something, say so clearly rather than making up information
        - Your responses should be conversational but professional
        
        Remember, you are helping a postman who needs quick, accurate information while making deliveries.
        """
        
        # Get current date
        current_date = datetime.now().strftime("%A, %B %d, %Y")
        
        # Get customer info with addresses and areas
        try:
            customer_info = []
            for name, info in self.predictor.customer_areas.items():
                address = self.predictor.customer_addresses.get(name, ["Unknown address"])[0]
                area = info
                customer_info.append(f"- {name}: Area: {area}, Address: {address}")
            
            customer_info_str = "\n".join(customer_info) if customer_info else "No customer information available."
        except Exception as e:
            logging.exception("Error retrieving customer information")
            customer_info_str = "Error retrieving customer information."
        
        # Get today's deliveries
        try:
            todays_orders = self.predictor.get_pending_orders()
            if todays_orders:
                deliveries_info = []
                for order in todays_orders:
                    delivery_info = f"- Order #{order['id']}: {order['name']} - {order['area']} - Package: {order['size']} - Scheduled for: {order['day']} at {order.get('optimal_time', 'unspecified time')}"
                    if 'address' in order:
                        delivery_info += f" - Address: {order['address']}"
                    deliveries_info.append(delivery_info)
                deliveries_info_str = "\n".join(deliveries_info)
            else:
                deliveries_info_str = "No deliveries scheduled for today."
        except Exception as e:
            logging.exception("Error retrieving today's deliveries")
            deliveries_info_str = "Error retrieving today's deliveries."
        
        # Get route info if available
        route_info_str = "No route currently optimized."
        if current_context and 'optimized_route' in current_context:
            try:
                route = current_context['optimized_route']
                route_info_str = f"Optimized route: {' → '.join(route['route'])}\nTotal distance: {route['total_distance']} km\nEstimated time: {route.get('estimated_time', 'Unknown')}"
            except Exception as e:
                logging.exception("Error processing route information")
                route_info_str = "Error processing route information."
        
        # Get optimal delivery times for each customer
        try:
            optimal_times_info = []
            for name, area in self.predictor.customer_areas.items():
                optimal_time = self.predictor.predict_delivery_time(name, area)
                failure_rate = self.predictor.get_failure_rate(name)
                optimal_times_info.append(f"- {name}: Best time is around {optimal_time} (Failure rate: {failure_rate:.1%})")
            
            optimal_times_str = "\n".join(optimal_times_info) if optimal_times_info else "No optimal delivery time information available."
        except Exception as e:
            logging.exception("Error retrieving optimal delivery times")
            optimal_times_str = "Error retrieving optimal delivery times."
        
        # Format the system prompt
        formatted_prompt = system_prompt.format(
            current_date=current_date,
            customer_info=customer_info_str,
            todays_deliveries=deliveries_info_str,
            route_info=route_info_str,
            optimal_times=optimal_times_str
        )
        
        return formatted_prompt
    
    def _generate_mock_response(self, query, system_context):
        """Generate a mock response when no API key is provided"""
        query = query.lower()
        
        if "optimal" in query and "time" in query:
            return "Based on historical data, the optimal delivery time varies by customer. For example, Aditya prefers deliveries around 15:00, while Meera is usually available after 18:00. Check the optimal delivery times section for specific recommendations."
        
        if "route" in query:
            return "The current optimized route has been calculated to minimize travel distance and delivery time. The sequence starts from the postman location at Iscon Center and follows the most efficient path through today's deliveries."
        
        if any(name.lower() in query for name in ["aditya", "kabir", "meera", "ishaan", "ananya", "riya"]):
            if "aditya" in query:
                return "Aditya is located in the Satellite area. The optimal delivery time is around 15:00, with a low failure rate of 12%. Today's package for Aditya is Medium sized."
            elif "kabir" in query:
                return "Kabir is in Thaltej area. The best delivery time is typically between 16:00-17:00. There's a pending Large package for delivery on Thursday."
            # Add other customer responses as needed
            
        if "today" in query and "deliveries" in query:
            return "There are 5 pending deliveries for today, distributed across Satellite, Bodakdev, and Vastrapur areas. The optimized route suggests starting with Satellite area deliveries in the morning, followed by others in the afternoon."
        
        # Default response
        return "I can help you with information about pending deliveries, optimal delivery times, customer details, and route optimization. What specific information do you need about today's deliveries?" 